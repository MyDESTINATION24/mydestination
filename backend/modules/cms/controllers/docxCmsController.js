import multer from 'multer';
import DocxContent from '../models/Content.js';
import DocxContentVersion from '../models/ContentVersion.js';
import DocxAuditLog from '../models/AuditLog.js';
import { validateDocxMagicBytes } from '../../../utils/fileValidator.js';
import { processDocxToAstAndReport } from '../services/docxParserService.js';

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadMiddleware = upload.single('file');

// 1. POST /api/cms/upload (Upload Draft & Generate Validation Report)
export const uploadDraft = async (req, res) => {
  try {
    const { title, slug } = req.body;
    if (!req.file || !slug) {
      return res.status(400).json({ success: false, message: 'DOCX file and slug token are required' });
    }

    // Security check: Zip Header Magic Bytes
    if (!validateDocxMagicBytes(req.file.buffer)) {
      return res.status(400).json({ success: false, message: 'Security Alert: File is not a valid DOCX Zip document' });
    }

    // Process XML into JSON AST & Validation Report
    const { jsonAst, validationReport } = await processDocxToAstAndReport(req.file.buffer);

    let content = await DocxContent.findOne({ slug });
    if (!content) {
      content = new DocxContent({ title, slug, currentDraftAst: jsonAst, lastValidationReport: validationReport });
    } else {
      content.title = title || content.title;
      content.currentDraftAst = jsonAst;
      content.hasUnpublishedChanges = true;
      content.lastValidationReport = validationReport;
    }
    await content.save();

    // Determine Incremental Version Number
    const lastVersionDoc = await DocxContentVersion.findOne({ contentId: content._id }).sort({ version: -1 });
    const nextVer = lastVersionDoc ? lastVersionDoc.version + 1 : 1;

    const versionDoc = await DocxContentVersion.create({
      contentId: content._id,
      slug: content.slug,
      jsonAst,
      version: nextVer,
      status: 'draft',
      validationReport,
      createdBy: req.body.adminName || 'System Admin',
    });

    // Audit Logging
    await DocxAuditLog.create({
      action: 'UPLOAD_DRAFT',
      slug: content.slug,
      version: nextVer,
      ipAddress: req.ip,
      details: `Created draft version ${nextVer}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Draft uploaded and typography normalized successfully',
      data: { content, version: versionDoc, validationReport },
    });
  } catch (error) {
    console.error('Error in uploadDraft:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. POST /api/cms/publish/:slug (Publish Draft Live)
export const publishContent = async (req, res) => {
  try {
    const { slug } = req.params;
    const content = await DocxContent.findOne({ slug });

    if (!content || !content.currentDraftAst || content.currentDraftAst.length === 0) {
      return res.status(404).json({ success: false, message: 'No draft content found to publish' });
    }

    const nextVerNum = content.publishedVersion + 1;
    content.publishedAst = content.currentDraftAst;
    content.publishedVersion = nextVerNum;
    content.hasUnpublishedChanges = false;
    await content.save();

    await DocxContentVersion.findOneAndUpdate(
      { contentId: content._id, version: nextVerNum },
      { status: 'published' }
    );

    await DocxAuditLog.create({
      action: 'PUBLISH',
      slug: content.slug,
      version: nextVerNum,
      ipAddress: req.ip,
      details: `Published version ${nextVerNum} live`,
    });

    return res.status(200).json({
      success: true,
      message: `Version ${nextVerNum} is now LIVE on website`,
      data: content,
    });
  } catch (error) {
    console.error('Error in publishContent:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. POST /api/cms/rollback/:versionId (Rollback to Target Version)
export const rollbackVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    const targetVer = await DocxContentVersion.findById(versionId);

    if (!targetVer) {
      return res.status(404).json({ success: false, message: 'Version history record not found' });
    }

    const content = await DocxContent.findById(targetVer.contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content record not found' });
    }

    const newVerNum = content.publishedVersion + 1;
    content.publishedAst = targetVer.jsonAst;
    content.publishedVersion = newVerNum;
    content.currentDraftAst = targetVer.jsonAst;
    content.hasUnpublishedChanges = false;
    await content.save();

    await DocxContentVersion.create({
      contentId: content._id,
      slug: content.slug,
      jsonAst: targetVer.jsonAst,
      version: newVerNum,
      status: 'published',
      createdBy: 'Admin (Rollback)',
    });

    await DocxAuditLog.create({
      action: 'ROLLBACK',
      slug: content.slug,
      version: newVerNum,
      ipAddress: req.ip,
      details: `Rolled back content to legacy version ${targetVer.version}`,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully rolled back to version ${targetVer.version}. Live version is now ${newVerNum}.`,
      data: content,
    });
  } catch (error) {
    console.error('Error in rollbackVersion:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. GET /api/cms/content/:slug (Public API for Website Frontend)
export const getPublishedContent = async (req, res) => {
  try {
    const { slug } = req.params;
    const content = await DocxContent.findOne({ slug }).select('title slug publishedAst publishedVersion updatedAt');

    if (!content || !content.publishedAst || content.publishedAst.length === 0) {
      return res.status(404).json({ success: false, message: 'Published content not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        slug: content.slug,
        ast: content.publishedAst,
        version: content.publishedVersion,
      },
    });
  } catch (error) {
    console.error('Error in getPublishedContent:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET /api/cms/history/:slug (Version History)
export const getVersionHistory = async (req, res) => {
  try {
    const { slug } = req.params;
    const history = await DocxContentVersion.find({ slug }).sort({ version: -1 });

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('Error in getVersionHistory:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
