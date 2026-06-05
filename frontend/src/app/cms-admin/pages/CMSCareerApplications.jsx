import React, { useState, useEffect } from 'react';
import { api } from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Eye, CheckCircle, XCircle, Trash2, Mail, Download, X } from 'lucide-react';

const AdminCareerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPreview, setSelectedPreview] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cms/career/applications');
      if (response.data.success) {
        setApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.put(`/cms/career/applications/${id}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteApplication = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        const response = await api.delete(`/cms/career/applications/${id}`);
        if (response.data.success) {
          toast.success('Application deleted');
          fetchApplications();
        }
      } catch (error) {
        console.error('Error deleting application:', error);
        toast.error('Failed to delete application');
      }
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      toast.loading('Downloading...', { id: 'download-toast' });
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename || 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      toast.success('Download complete', { id: 'download-toast' });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file', { id: 'download-toast' });
    }
  };

  const getFileUrl = (imgPath) => {
    if (!imgPath) return '';
    return imgPath.startsWith('http') 
      ? imgPath 
      : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '')}${imgPath.replace(/\\/g, '/')}`;
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Job Applications</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="p-4 font-semibold">Applicant</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Resume/Image</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No applications found.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{app.firstName} {app.lastName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail size={14} />
                        <a href={`mailto:${app.email}`} className="hover:text-emerald-600">{app.email}</a>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium border">{app.role}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${app.status === 'New' ? 'bg-blue-100 text-blue-800' : ''}
                        ${app.status === 'Reviewed' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${app.status === 'Contacted' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${app.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {app.image ? (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setSelectedPreview(getFileUrl(app.image))} 
                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-1 w-fit"
                          >
                            <Eye size={16} /> View
                          </button>
                          <button 
                            onClick={() => handleDownload(getFileUrl(app.image), app.image.split('/').pop().split('\\').pop() || 'resume')} 
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 w-fit"
                          >
                            <Download size={16} /> Download
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <select 
                        value={app.status}
                        onChange={(e) => updateStatus(app._id, e.target.value)}
                        className="text-xs border rounded p-1 bg-white"
                      >
                        <option value="New">New</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <button onClick={() => deleteApplication(app._id)} className="text-red-500 hover:text-red-700 ml-2" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Eye size={20} className="text-emerald-600"/> File Preview
              </h3>
              <button 
                onClick={() => setSelectedPreview(null)} 
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex justify-center items-center">
              {selectedPreview.toLowerCase().includes('.pdf') ? (
                <iframe src={selectedPreview} className="w-full h-full rounded border bg-white" title="PDF Preview" />
              ) : (
                <img src={selectedPreview} alt="Preview" className="max-w-full max-h-full object-contain rounded shadow-sm" />
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => handleDownload(selectedPreview, 'downloaded_file')}
                className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition flex items-center gap-2 text-sm"
              >
                <Download size={16} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCareerApplications;
