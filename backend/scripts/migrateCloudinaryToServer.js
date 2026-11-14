/**
 * Copy every Cloudinary image the database points at onto this server
 * (re-encoded to WebP by services/mediaStorage.js) and rewrite the links.
 *
 *   node scripts/migrateCloudinaryToServer.js            # dry run: counts only
 *   node scripts/migrateCloudinaryToServer.js --apply    # download + rewrite
 *
 * - Walks every collection and every string field (nested objects, arrays and
 *   HTML such as blog bodies), finding res.cloudinary.com URLs.
 * - Each unique URL is downloaded once. If a download fails the old URL is
 *   left as it is, so nothing breaks; re-running retries just those.
 * - Videos are left on Cloudinary (they cannot become WebP images).
 * - Nothing is deleted from Cloudinary: it stays as the backup / rollback.
 *   The old -> new mapping is saved to MEDIA_ROOT/cloudinary-map.json and
 *   re-used on later runs, so the script is safe to run again.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { saveMedia, MEDIA_ROOT, MEDIA_PUBLIC_URL } from '../services/mediaStorage.js';

const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 4;
const URL_PATTERN = /https?:\/\/res\.cloudinary\.com\/[^\s"'<>)\\]+/g;
const MAP_FILE = path.join(MEDIA_ROOT, 'cloudinary-map.json');

const log = (...args) => console.log(...args);

/** rukkoin/properties/abc.jpg (after /upload/, version and transforms) -> folder */
export const folderFor = (url) => {
  const afterUpload = url.split('/upload/')[1] || '';
  const parts = afterUpload.split('/').filter(Boolean);
  parts.pop(); // file name
  const folder = parts
    // skip the version (v123) and transformation segments (w_500,c_fill / f_auto)
    .filter((p) => !/^v\d+$/.test(p) && !/^[a-z]{1,3}_/.test(p) && !p.includes(','))
    .map((p) => p.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60))
    .filter(Boolean)
    .join('/');
  return folder || 'migrated';
};

export const collectUrls = (value, found) => {
  if (typeof value === 'string') {
    if (value.includes('res.cloudinary.com')) {
      for (const m of value.match(URL_PATTERN) || []) found.add(m);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectUrls(v, found));
  } else if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)
    && value._bsontype === undefined) {
    Object.values(value).forEach((v) => collectUrls(v, found));
  }
};

export const rewrite = (value, map) => {
  if (typeof value === 'string') {
    if (!value.includes('res.cloudinary.com')) return value;
    return value.replace(URL_PATTERN, (m) => map[m] || m);
  }
  if (Array.isArray(value)) return value.map((v) => rewrite(v, map));
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)
    && value._bsontype === undefined) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = rewrite(v, map);
    return out;
  }
  return value;
};

const loadMap = async () => {
  try {
    return JSON.parse(await fs.readFile(MAP_FILE, 'utf8'));
  } catch {
    return {};
  }
};

const download = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

const run = async () => {
  if (!process.env.MONGODB_URL) throw new Error('MONGODB_URL is not set');
  await mongoose.connect(process.env.MONGODB_URL);
  const db = mongoose.connection.db;

  log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN (add --apply to migrate)'}`);
  log(`Media folder: ${MEDIA_ROOT}`);
  log(`Public URL:   ${MEDIA_PUBLIC_URL}\n`);

  // 1. Find every Cloudinary URL and which collections use them.
  const collections = (await db.listCollections({ type: 'collection' }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'));

  const urls = new Set();
  const perCollection = {};
  for (const name of collections) {
    let docs = 0;
    const before = urls.size;
    for await (const doc of db.collection(name).find({})) {
      const found = new Set();
      collectUrls(doc, found);
      if (found.size) {
        docs += 1;
        found.forEach((u) => urls.add(u));
      }
    }
    if (docs) perCollection[name] = { docs, newUrls: urls.size - before };
  }

  const all = [...urls];
  const videos = all.filter((u) => u.includes('/video/upload/'));
  const toCopy = all.filter((u) => !u.includes('/video/upload/'));
  log('Collections with Cloudinary links:');
  for (const [name, info] of Object.entries(perCollection)) log(`  ${name}: ${info.docs} documents`);
  log(`\nUnique URLs: ${all.length} (${toCopy.length} images/PDFs, ${videos.length} videos kept on Cloudinary)`);

  if (!APPLY) {
    await mongoose.disconnect();
    return;
  }

  // 2. Download and store each one (re-using earlier runs).
  await fs.mkdir(MEDIA_ROOT, { recursive: true });
  const map = await loadMap();
  const pending = toCopy.filter((u) => !map[u]);
  log(`Already copied: ${toCopy.length - pending.length}, to copy now: ${pending.length}`);

  let done = 0;
  const failed = [];
  let savedBytes = 0;
  let originalBytes = 0;
  const queue = [...pending];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const buffer = await download(url);
        const stored = await saveMedia(buffer, { folder: folderFor(url), allowWord: true });
        map[url] = stored.url;
        originalBytes += buffer.length;
        savedBytes += stored.bytes;
      } catch (error) {
        failed.push({ url, error: error.message });
      }
      done += 1;
      if (done % 25 === 0 || done === pending.length) {
        log(`  ${done}/${pending.length} copied (${failed.length} failed)`);
        await fs.writeFile(MAP_FILE, JSON.stringify(map, null, 1));
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await fs.writeFile(MAP_FILE, JSON.stringify(map, null, 1));
  if (originalBytes) {
    log(`Size: ${(originalBytes / 1048576).toFixed(1)} MB on Cloudinary -> ${(savedBytes / 1048576).toFixed(1)} MB as WebP`);
  }

  // 3. Rewrite the links, only touching fields that changed.
  let updatedDocs = 0;
  for (const name of Object.keys(perCollection)) {
    const col = db.collection(name);
    for await (const doc of col.find({})) {
      const set = {};
      for (const [key, value] of Object.entries(doc)) {
        if (key === '_id') continue;
        const found = new Set();
        collectUrls(value, found);
        if (!found.size || ![...found].some((u) => map[u])) continue;
        set[key] = rewrite(value, map);
      }
      if (Object.keys(set).length) {
        await col.updateOne({ _id: doc._id }, { $set: set });
        updatedDocs += 1;
      }
    }
  }

  log(`\nUpdated ${updatedDocs} documents.`);
  if (failed.length) {
    log(`\n${failed.length} URLs could not be copied and still point at Cloudinary:`);
    failed.slice(0, 50).forEach((f) => log(`  ${f.error}  ${f.url}`));
    if (failed.length > 50) log(`  ...and ${failed.length - 50} more`);
  }
  log(`\nMapping saved to ${MAP_FILE}`);
  await mongoose.disconnect();
};

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  run().catch(async (error) => {
    console.error('Migration failed:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}
