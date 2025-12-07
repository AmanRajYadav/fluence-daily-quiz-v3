import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Copy,
  Trash2,
  RefreshCw,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileArchive,
  FileSpreadsheet,
  Edit3,
  Save,
  XCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  getTranscripts,
  downloadTranscript,
  copyToClipboard,
  deleteTranscript,
  getInstitutions,
  formatDate,
  formatTime,
  formatFileSize,
  formatNumber,
  bulkDownloadTranscripts,
  exportToCSV,
  searchInTranscriptContent,
  highlightSearchTerm,
  updateTranscript,
  getAnalytics
} from '../../services/transcriptService';

/**
 * Transcript Management UI - ENHANCED VERSION
 *
 * Admin-only interface for aman@fluence.ac to view, filter, download,
 * and manage all audio transcripts
 *
 * ADVANCED FEATURES:
 * - Bulk download (ZIP)
 * - Export to CSV
 * - Full-text search
 * - Edit transcripts
 * - Analytics dashboard
 * - Pagination
 */
const TranscriptManagement = () => {
  // State management
  const [transcripts, setTranscripts] = useState([]);
  const [allTranscripts, setAllTranscripts] = useState([]); // For full-text search
  const [filteredTranscripts, setFilteredTranscripts] = useState([]); // After full-text search
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingTranscript, setViewingTranscript] = useState(null);
  const [toast, setToast] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    institutionId: '',
    sessionType: ''
  });

  // Advanced features state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [fullTextSearch, setFullTextSearch] = useState(false);
  const [fullTextSearchTerm, setFullTextSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Load data on mount
  useEffect(() => {
    loadInstitutions();
    loadTranscripts();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadTranscripts();
  }, [filters]);

  // Apply full-text search when enabled
  useEffect(() => {
    if (fullTextSearch && fullTextSearchTerm) {
      const results = searchInTranscriptContent(fullTextSearchTerm, allTranscripts);
      setFilteredTranscripts(results);
    } else {
      setFilteredTranscripts(transcripts);
    }
  }, [fullTextSearch, fullTextSearchTerm, transcripts, allTranscripts]);

  // Calculate analytics when transcripts change
  useEffect(() => {
    if (transcripts.length > 0) {
      const analyticsData = getAnalytics(transcripts);
      setAnalytics(analyticsData);
    }
  }, [transcripts]);

  /**
   * Load institutions for filter dropdown
   */
  const loadInstitutions = async () => {
    try {
      const data = await getInstitutions();
      setInstitutions(data);
    } catch (error) {
      console.error('Failed to load institutions:', error);
    }
  };

  /**
   * Load transcripts with current filters
   */
  const loadTranscripts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTranscripts(filters);
      setTranscripts(data);
      setAllTranscripts(data); // Store for full-text search
      setFilteredTranscripts(data);
      setSelectedIds(new Set()); // Clear selection on reload
    } catch (error) {
      console.error('Failed to load transcripts:', error);
      setError('Failed to load transcripts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page
  };

  /**
   * Handle bulk selection toggle
   */
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedTranscripts.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(paginatedTranscripts.map(t => t.id));
      setSelectedIds(allIds);
    }
  };

  /**
   * Handle single row selection
   */
  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  /**
   * Handle bulk download (ZIP)
   */
  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) {
      showToast('Please select transcripts to download', 'error');
      return;
    }

    try {
      const selectedTranscripts = transcripts.filter(t => selectedIds.has(t.id));
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `transcripts-${dateStr}.zip`;

      await bulkDownloadTranscripts(selectedTranscripts, filename);
      showToast(`Downloaded ${selectedIds.size} transcripts as ZIP`, 'success');
    } catch (error) {
      console.error('Bulk download error:', error);
      showToast('Failed to download transcripts', 'error');
    }
  };

  /**
   * Handle export to CSV
   */
  const handleExportCSV = () => {
    try {
      const dataToExport = selectedIds.size > 0
        ? transcripts.filter(t => selectedIds.has(t.id))
        : transcripts;

      if (dataToExport.length === 0) {
        showToast('No transcripts to export', 'error');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `transcripts-metadata-${dateStr}.csv`;

      exportToCSV(dataToExport, filename);
      showToast(`Exported ${dataToExport.length} transcripts to CSV`, 'success');
    } catch (error) {
      console.error('CSV export error:', error);
      showToast('Failed to export CSV', 'error');
    }
  };

  /**
   * Handle full-text search toggle
   */
  const handleFullTextSearchToggle = () => {
    setFullTextSearch(!fullTextSearch);
    if (fullTextSearch) {
      setFullTextSearchTerm('');
      setFilteredTranscripts(transcripts);
    }
  };

  /**
   * Handle download
   */
  const handleDownload = (transcript, filename) => {
    try {
      downloadTranscript(transcript, filename);
      showToast('Transcript downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to download transcript', 'error');
    }
  };

  /**
   * Handle view (open modal)
   */
  const handleView = (transcript) => {
    setViewingTranscript(transcript);
    setEditMode(false);
    setEditedTranscript(transcript.transcript);
  };

  /**
   * Handle edit mode toggle
   */
  const handleEditToggle = () => {
    if (editMode) {
      // Canceling edit
      setEditMode(false);
      setEditedTranscript(viewingTranscript.transcript);
    } else {
      // Entering edit mode
      setEditMode(true);
    }
  };

  /**
   * Handle save edited transcript
   */
  const handleSaveEdit = async () => {
    if (!editedTranscript.trim()) {
      showToast('Transcript cannot be empty', 'error');
      return;
    }

    try {
      setSaving(true);
      await updateTranscript(viewingTranscript.id, editedTranscript);

      // Update local state
      const updatedTranscripts = transcripts.map(t =>
        t.id === viewingTranscript.id
          ? { ...t, transcript: editedTranscript, transcript_length: editedTranscript.length }
          : t
      );
      setTranscripts(updatedTranscripts);
      setAllTranscripts(updatedTranscripts);

      // Update viewing transcript
      setViewingTranscript({
        ...viewingTranscript,
        transcript: editedTranscript,
        transcript_length: editedTranscript.length
      });

      setEditMode(false);
      showToast('Transcript updated successfully', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showToast('Failed to save transcript', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async (text) => {
    const result = await copyToClipboard(text);
    if (result.success) {
      showToast('Copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy', 'error');
    }
  };

  /**
   * Handle delete with confirmation
   */
  const handleDelete = async (uploadId, filename) => {
    if (!window.confirm(
      `Are you sure you want to delete "${filename}"?\n\nThis action cannot be undone.`
    )) {
      return;
    }

    try {
      await deleteTranscript(uploadId);
      showToast('Transcript deleted successfully', 'success');
      loadTranscripts(); // Refresh list
    } catch (error) {
      showToast('Failed to delete transcript', 'error');
    }
  };

  /**
   * Show toast notification
   */
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * Get status badge component
   */
  const getStatusBadge = (status) => {
    const badges = {
      completed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      ),
      processing: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing
        </span>
      ),
      failed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      )
    };
    return badges[status] || null;
  };

  /**
   * Get session type badge
   */
  const getSessionTypeBadge = (type) => {
    return type === 'personal' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
        Personal
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-700">
        Group
      </span>
    );
  };

  // Pagination calculations
  const displayTranscripts = fullTextSearch ? filteredTranscripts : transcripts;
  const totalPages = Math.ceil(displayTranscripts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTranscripts = displayTranscripts.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Transcript Management
            </h1>
            <p className="text-gray-600 mt-2">
              View, download, and manage all audio transcripts
            </p>
          </div>

          {/* Analytics Toggle Button */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Transcripts */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-600 mb-1">Total Transcripts</div>
              <div className="text-2xl font-bold text-blue-900">{formatNumber(analytics.totalTranscripts)}</div>
            </div>

            {/* Total Tokens */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm font-medium text-green-600 mb-1">Total Tokens Used</div>
              <div className="text-2xl font-bold text-green-900">{formatNumber(analytics.totalTokens)}</div>
              <div className="text-xs text-green-600 mt-1">Avg: {formatNumber(Math.round(analytics.avgTokens))}/transcript</div>
            </div>

            {/* Total Size */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm font-medium text-purple-600 mb-1">Total File Size</div>
              <div className="text-2xl font-bold text-purple-900">{analytics.totalFileSize.toFixed(1)} MB</div>
              <div className="text-xs text-purple-600 mt-1">Avg: {analytics.avgFileSize.toFixed(1)} MB/file</div>
            </div>

            {/* Avg Processing Time */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm font-medium text-orange-600 mb-1">Avg Processing Time</div>
              <div className="text-2xl font-bold text-orange-900">{analytics.avgProcessingTime.toFixed(1)}s</div>
            </div>
          </div>

          {/* Session Type Breakdown */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">By Session Type</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Personal Sessions</span>
                  <span className="font-bold text-purple-600">{analytics.bySessionType.personal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Group Sessions</span>
                  <span className="font-bold text-cyan-600">{analytics.bySessionType.group}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Cost Estimate</h3>
              <p className="text-sm text-gray-600 mb-2">
                Estimated cost if Gemini Pro wasn't free:
              </p>
              <div className="text-3xl font-bold text-green-600">
                ${analytics.costEstimate.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                (Currently FREE - Gemini 2.5 Pro)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Filename
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search filename..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution
            </label>
            <select
              value={filters.institutionId}
              onChange={(e) => handleFilterChange('institutionId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Institutions</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Type
            </label>
            <select
              value={filters.sessionType}
              onChange={(e) => handleFilterChange('sessionType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="personal">Personal</option>
              <option value="group">Group</option>
            </select>
          </div>
        </div>

        {/* Full-Text Search Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fullTextSearch}
                onChange={handleFullTextSearchToggle}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Search within transcript content (full-text search)
              </span>
            </label>

            {fullTextSearch && (
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search in transcript content..."
                  value={fullTextSearchTerm}
                  onChange={(e) => setFullTextSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <button
            onClick={loadTranscripts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} transcript{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear selection
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileArchive className="w-4 h-4" />
                Download as ZIP
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Selected to CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export All CSV Button (when no selection) */}
      {selectedIds.size === 0 && transcripts.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export All to CSV
          </button>
        </div>
      )}

      {/* Results Counter */}
      <div className="mb-4 text-sm text-gray-600">
        {fullTextSearch && fullTextSearchTerm ? (
          <>
            Found {filteredTranscripts.length} transcript{filteredTranscripts.length !== 1 ? 's' : ''} matching "{fullTextSearchTerm}"
            {filteredTranscripts.length > 0 && (
              <span className="ml-2">
                (showing {startIndex + 1}-{Math.min(endIndex, filteredTranscripts.length)} of {filteredTranscripts.length})
              </span>
            )}
          </>
        ) : (
          <>
            Showing {startIndex + 1}-{Math.min(endIndex, transcripts.length)} of {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}
          </>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading transcripts...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayTranscripts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transcripts found</h3>
          <p className="text-gray-600">
            {fullTextSearch && fullTextSearchTerm
              ? `No transcripts contain "${fullTextSearchTerm}"`
              : filters.search || filters.dateFrom || filters.institutionId || filters.sessionType
              ? 'Try adjusting your search or filter criteria'
              : 'No completed transcripts available yet'}
          </p>
        </div>
      )}

      {/* Desktop Table View */}
      {!loading && paginatedTranscripts.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Bulk Selection Checkbox */}
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === paginatedTranscripts.length && paginatedTranscripts.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTranscripts.map((row) => (
                    <tr key={row.id} className={`hover:bg-gray-50 ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                      </td>

                      {/* Filename */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {row.transcript_filename}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.institutions?.name || 'Unknown'}
                        </div>
                        {/* Show match count for full-text search */}
                        {fullTextSearch && row.matchCount > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {row.matchCount} match{row.matchCount !== 1 ? 'es' : ''} found
                          </div>
                        )}
                      </td>

                      {/* Date/Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(row.upload_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(row.class_time)}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSessionTypeBadge(row.session_type)}
                      </td>

                      {/* Class */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {row.classes?.class_code || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.classes?.class_name || ''}
                        </div>
                      </td>

                      {/* Student */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.students?.full_name || '-'}
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>💾 {formatFileSize(row.file_size_mb)}</div>
                          <div>📝 {formatNumber(row.transcript_length)} chars</div>
                          <div>🤖 {formatNumber(row.gemini_tokens_used)} tokens</div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(row.transcript, row.transcript_filename)}
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded transition-colors"
                            title="Download transcript"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleView(row)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                            title="View transcript"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopy(row.transcript)}
                            className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, row.transcript_filename)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                            title="Delete transcript"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {paginatedTranscripts.map((row) => (
              <div key={row.id} className={`bg-white rounded-lg shadow p-4 space-y-3 ${selectedIds.has(row.id) ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Header with Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {row.transcript_filename}
                    </h3>
                    {fullTextSearch && row.matchCount > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {row.matchCount} match{row.matchCount !== 1 ? 'es' : ''} found
                      </div>
                    )}
                  </div>
                  {getSessionTypeBadge(row.session_type)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>📅 {formatDate(row.upload_date)}</div>
                  <div>⏰ {formatTime(row.class_time)}</div>
                  <div>🏫 {row.classes?.class_code || '-'}</div>
                  <div>👤 {row.students?.full_name || '-'}</div>
                  <div>💾 {formatFileSize(row.file_size_mb)}</div>
                  <div>📝 {formatNumber(row.transcript_length)} chars</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleDownload(row.transcript, row.transcript_filename)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleView(row)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopy(row.transcript)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id, row.transcript_filename)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Transcript Modal - ENHANCED WITH EDIT MODE */}
      {viewingTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {viewingTranscript.transcript_filename}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <span>{formatDate(viewingTranscript.upload_date)}</span>
                  <span>•</span>
                  <span>{formatTime(viewingTranscript.class_time)}</span>
                  <span>•</span>
                  <span>{formatNumber(viewingTranscript.transcript_length)} chars</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingTranscript(null);
                  setEditMode(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {editMode ? (
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="w-full h-full min-h-[400px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  placeholder="Edit transcript..."
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                  {fullTextSearch && fullTextSearchTerm ? (
                    <div dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(viewingTranscript.transcript, fullTextSearchTerm)
                    }} />
                  ) : (
                    viewingTranscript.transcript
                  )}
                </pre>
              )}

              {/* Show match snippets for full-text search */}
              {fullTextSearch && viewingTranscript.matchSnippets && viewingTranscript.matchSnippets.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Match Snippets ({viewingTranscript.matchCount} total matches)
                  </h3>
                  <div className="space-y-2">
                    {viewingTranscript.matchSnippets.map((snippet, idx) => (
                      <div key={idx} className="text-sm text-gray-700 bg-white p-2 rounded">
                        ...{snippet}...
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex gap-2 justify-between bg-gray-50">
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDownload(viewingTranscript.transcript, viewingTranscript.transcript_filename)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleCopy(viewingTranscript.transcript)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setViewingTranscript(null);
                  setEditMode(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptManagement;
