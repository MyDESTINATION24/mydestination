import React, { useState, useEffect } from 'react';

/**
 * Enterprise Admin DOCX Typography CMS Portal
 * Features:
 * - DOCX Template File Upload
 * - Validation Report Display (Headings, Paragraphs, Images Ignored, Font/Color Fallbacks)
 * - Side-by-Side Preview Mode
 * - Draft Publishing Workflow
 * - Version History Table & One-Click Rollback
 */
const AdminDocxTypographyCMS = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('Hero Section Title');
  const [slug, setSlug] = useState('hero_title');
  const [draftContent, setDraftContent] = useState(null);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/cms/docx/history/${slug}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    }
  };

  useEffect(() => {
    if (slug) {
      loadHistory();
    }
  }, [slug]);

  const handleUploadDraft = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a .docx document file');
    if (!slug) return alert('Please specify a placeholder slug');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('slug', slug);

    try {
      setLoading(true);
      setStatusMsg('Parsing DOCX XML, stripping images & mapping typography...');
      
      const res = await fetch('/api/cms/docx/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setDraftContent(data.data.content);
        setReport(data.data.validationReport);
        setStatusMsg('Draft processed successfully! Review preview below before publishing.');
        loadHistory();
      } else {
        setStatusMsg(`Error: ${data.message}`);
      }
    } catch (err) {
      setStatusMsg('Upload failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setStatusMsg('Publishing version to live website...');
      
      const res = await fetch(`/api/cms/docx/publish/${slug}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg(data.message);
        setDraftContent(data.data);
        loadHistory();
      } else {
        setStatusMsg(`Publish Error: ${data.message}`);
      }
    } catch (err) {
      setStatusMsg('Publish action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionId) => {
    if (!window.confirm('Are you sure you want to rollback live content to this version?')) return;

    try {
      setLoading(true);
      setStatusMsg('Executing rollback...');

      const res = await fetch(`/api/cms/docx/rollback/${versionId}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg(data.message);
        setDraftContent(data.data);
        loadHistory();
      } else {
        setStatusMsg(`Rollback Error: ${data.message}`);
      }
    } catch (err) {
      setStatusMsg('Rollback action failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen space-y-6 font-sans">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Dynamic DOCX Typography CMS Portal</h1>
        <p className="text-slate-500 text-sm">Upload Word documents to update text content and typography safely without breaking website React layout.</p>
      </div>

      {statusMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-medium">
          {statusMsg}
        </div>
      )}

      {/* Upload Box */}
      <form onSubmit={handleUploadDraft} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Upload New DOCX Draft</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content Title</label>
            <input
              type="text"
              className="w-full border border-slate-300 p-2.5 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Home Page Hero Title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder Slug Token</label>
            <input
              type="text"
              className="w-full border border-slate-300 p-2.5 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. hero_title"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select .DOCX Template File</label>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border border-slate-300 p-2 rounded-md text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing Document...' : 'Upload & Generate Draft'}
        </button>
      </form>

      {/* Validation Summary */}
      {report && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Validation Report Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <span className="block text-slate-500 text-xs">Headings</span>
              <span className="font-bold text-slate-800 text-lg">{report.detectedHeadings}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <span className="block text-slate-500 text-xs">Paragraphs</span>
              <span className="font-bold text-slate-800 text-lg">{report.detectedParagraphs}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <span className="block text-slate-500 text-xs">Images Stripped</span>
              <span className="font-bold text-emerald-600 text-lg">{report.imagesIgnored} (Ignored)</span>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <span className="block text-slate-500 text-xs">Fallback Mappings</span>
              <span className="font-bold text-amber-600 text-lg">
                {(report.fontFallbacks?.length || 0) + (report.colorFallbacks?.length || 0)}
              </span>
            </div>
          </div>

          {(report.fontFallbacks?.length > 0 || report.colorFallbacks?.length > 0) && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-1 text-amber-800">
              {report.fontFallbacks.map((f, i) => <p key={i}>⚠ {f}</p>)}
              {report.colorFallbacks.map((c, i) => <p key={i}>⚠ {c}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Preview */}
      {draftContent && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Draft AST Preview</h2>
              <p className="text-xs text-slate-500">Live preview of mapped typography tokens before publishing.</p>
            </div>
            {draftContent.hasUnpublishedChanges && (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                Publish Live to Website
              </button>
            )}
          </div>

          <div className="p-6 border rounded-lg bg-slate-50 min-h-[120px]">
            {draftContent.currentDraftAst?.map((node, idx) => {
              const { nodeType, level, text, typography } = node;
              const classes = [
                typography.fontFamilyClass || 'font-inter',
                typography.fontSizeClass || 'text-base',
                typography.colorClass || 'text-slate-900',
                typography.isBold ? 'font-bold' : '',
                typography.isItalic ? 'italic' : '',
                typography.isUnderline ? 'underline' : '',
                typography.alignment ? `text-${typography.alignment}` : '',
              ].filter(Boolean).join(' ');

              if (nodeType === 'heading') {
                const Tag = `h${level || 1}`;
                return <Tag key={idx} className={classes}>{text}</Tag>;
              }
              return <p key={idx} className={classes}>{text}</p>;
            })}
          </div>
        </div>
      )}

      {/* Version History Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Version History & Rollback System</h2>
        
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No version history recorded yet for slug '{slug}'.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-slate-100 text-slate-700">
                  <th className="p-3">Version</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((ver) => (
                  <tr key={ver._id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">v{ver.version}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        ver.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ver.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{ver.createdBy}</td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(ver.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleRollback(ver._id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs underline"
                      >
                        Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDocxTypographyCMS;
