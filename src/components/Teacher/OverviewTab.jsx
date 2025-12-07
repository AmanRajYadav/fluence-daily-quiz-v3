/**
 * Overview Tab Component
 *
 * Main dashboard overview that displays:
 * - StatsCards (4 key metrics)
 * - AudioUploadCard (upload class recordings)
 * - RecentUploadsTable (upload history & status)
 * - SRSTeachingPlan (What to teach today based on Spaced Repetition)
 * - AlertsPanel (struggling students)
 *
 * This is the landing page when teachers login
 */

import React, { useState } from 'react';
import StatsCards from './StatsCards';
import SRSTeachingPlan from './SRSTeachingPlan';
import AlertsPanel from './AlertsPanel';
import AudioUploadCard from './AudioUploadCard';
import RecentUploadsTable from './RecentUploadsTable';

const OverviewTab = () => {
  // Trigger to refresh recent uploads after successful upload
  const [uploadRefreshTrigger, setUploadRefreshTrigger] = useState(0);

  const handleUploadComplete = (result) => {
    console.log('[OverviewTab] Upload complete:', result);
    // Trigger refresh of recent uploads table
    setUploadRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">
          Monitor your institution's performance at a glance
        </p>
      </div>

      {/* Stats Cards Grid */}
      <StatsCards />

      {/* Audio Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <AudioUploadCard onUploadComplete={handleUploadComplete} />

        {/* Recent Uploads */}
        <RecentUploadsTable refreshTrigger={uploadRefreshTrigger} />
      </div>

      {/* SRS Teaching Plan - What to teach today */}
      <SRSTeachingPlan />

      {/* Alerts Panel */}
      <AlertsPanel />
    </div>
  );
};

export default OverviewTab;
