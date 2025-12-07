/**
 * Recent Uploads Table Component
 *
 * Shows recent audio upload history with:
 * - Processing status indicators
 * - Questions generated count
 * - Class/Student info
 * - Error messages for failed uploads
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileAudio,
  Users,
  User,
  Download
} from 'lucide-react';
import { getCurrentSession } from '../../services/authService';
import { getRecentUploads } from '../../services/audioUploadService';

const RecentUploadsTable = ({ refreshTrigger }) => {
  const session = getCurrentSession();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUploads = useCallback(async () => {
    if (!session?.institution_id) return;

    setLoading(true);
    const data = await getRecentUploads(session.institution_id, null, 10);
    setUploads(data);
    setLoading(false);
  }, [session?.institution_id]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads, refreshTrigger]);

  // Auto-refresh every 30 seconds for pending uploads
  useEffect(() => {
    const hasPending = uploads.some(u => u.processing_status === 'pending' || u.processing_status === 'processing');

    if (hasPending) {
      const interval = setInterval(loadUploads, 30000);
      return () => clearInterval(interval);
    }
  }, [uploads, loadUploads]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    // Convert 24h time to 12h format
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (loading && uploads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading recent uploads...
        </div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <FileAudio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No uploads yet</p>
        <p className="text-sm text-gray-400">Upload your first class recording above</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Recent Uploads</h3>
        <button
          onClick={loadUploads}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date / Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Questions
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {uploads.map((upload) => (
              <tr key={upload.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(upload.upload_date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(upload.class_time)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {upload.class?.class_name || '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {upload.class?.class_code || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {upload.session_type === 'personal' ? (
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-900">Personal</div>
                        {upload.student && (
                          <div className="text-xs text-gray-500">
                            {upload.student.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-900">Group</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(upload.processing_status)}
                  {upload.error_message && (
                    <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={upload.error_message}>
                      {upload.error_message}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {upload.processing_status === 'completed' ? (
                    <span className="text-sm font-semibold text-green-600">
                      {upload.questions_generated || 30}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {upload.file_url && (
                    <a
                      href={upload.file_url}
                      download={upload.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download audio file"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentUploadsTable;
