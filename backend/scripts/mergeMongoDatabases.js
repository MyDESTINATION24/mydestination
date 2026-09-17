import { MongoClient } from 'mongodb';

// Credentials come only from the environment; they used to be hardcoded here.
const SOURCE_URI = process.env.SOURCE_MONGODB_URI;
const SOURCE_DB_NAME = process.env.SOURCE_MONGODB_DB_NAME || 'appzeto_taxi';
const TARGET_URI =
  process.env.TARGET_MONGODB_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL;
const TARGET_DB_NAME = process.env.TARGET_MONGODB_DB_NAME || process.env.MONGODB_DB_NAME || 'myDestination';
const BATCH_SIZE = Number(process.env.MONGO_MERGE_BATCH_SIZE || 250);
const BACKUP_PREFIX = `backup_source_import_${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;

const cloneIndexes = async (sourceCollection, targetCollection) => {
  const indexes = await sourceCollection.indexes();

  for (const index of indexes) {
    if (index.name === '_id_') {
      continue;
    }

    const { key, name, v, ns, background, ...rest } = index;
    try {
      await targetCollection.createIndex(key, { name, ...rest });
    } catch (error) {
      console.warn(`Index copy skipped for ${targetCollection.collectionName}.${name}: ${error.message}`);
    }
  }
};

const copyDocuments = async (sourceCollection, targetCollection) => {
  const cursor = sourceCollection.find({});
  let batch = [];
  let copied = 0;

  const flushBatch = async () => {
    if (!batch.length) {
      return;
    }

    await targetCollection.insertMany(batch, { ordered: false });
    copied += batch.length;
    batch = [];
  };

  for await (const document of cursor) {
    batch.push(document);
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }

  await flushBatch();
  return copied;
};

const backupTargetCollection = async (targetDb, collectionName) => {
  const sourceCollection = targetDb.collection(collectionName);
  const count = await sourceCollection.estimatedDocumentCount();

  if (!count) {
    return null;
  }

  const backupName = `${BACKUP_PREFIX}_${collectionName}`;
  await sourceCollection.aggregate([{ $match: {} }, { $out: backupName }]).toArray();
  return { backupName, count };
};

const replaceCollection = async (sourceDb, targetDb, collectionName) => {
  const sourceCollection = sourceDb.collection(collectionName);
  const sourceCount = await sourceCollection.estimatedDocumentCount();
  const backup = await backupTargetCollection(targetDb, collectionName);
  const hadTargetCollection = (await targetDb.listCollections({ name: collectionName }, { nameOnly: true }).toArray()).length > 0;

  if (hadTargetCollection) {
    await targetDb.collection(collectionName).drop().catch((error) => {
      if (error?.codeName !== 'NamespaceNotFound') {
        throw error;
      }
    });
  }

  if (!sourceCount) {
    await targetDb.createCollection(collectionName).catch(() => {});
    return {
      collectionName,
      sourceCount,
      copied: 0,
      backup,
    };
  }

  const recreatedTargetCollection = targetDb.collection(collectionName);
  const copied = await copyDocuments(sourceCollection, recreatedTargetCollection);
  await cloneIndexes(sourceCollection, recreatedTargetCollection);

  return {
    collectionName,
    sourceCount,
    copied,
    backup,
  };
};

const main = async () => {
  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    console.log(`Source: ${SOURCE_DB_NAME}`);
    console.log(`Target: ${TARGET_DB_NAME}`);
    console.log(`Backup prefix: ${BACKUP_PREFIX}`);

    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db(SOURCE_DB_NAME);
    const targetDb = targetClient.db(TARGET_DB_NAME);
    const collections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();

    const results = [];
    for (const { name } of collections) {
      const result = await replaceCollection(sourceDb, targetDb, name);
      results.push(result);
      const backupLabel = result.backup ? ` | backup=${result.backup.backupName} (${result.backup.count})` : '';
      console.log(`${name}: copied ${result.copied}/${result.sourceCount}${backupLabel}`);
    }

    const totalDocuments = results.reduce((sum, item) => sum + item.copied, 0);
    const backedUpCollections = results.filter((item) => item.backup).length;
    console.log(
      `Done. Collections replaced: ${results.length}. Documents copied: ${totalDocuments}. Backups created: ${backedUpCollections}.`,
    );
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
  }
};

main().catch((error) => {
  console.error('Mongo replace failed:', error);
  process.exitCode = 1;
});
