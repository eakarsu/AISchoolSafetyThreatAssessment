import React from 'react';
import { FaBullhorn } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Alert Title' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Sent' },
];

const formFields = [
  { key: 'title', label: 'Alert Title', type: 'text', required: true },
  { key: 'message', label: 'Message', type: 'textarea', required: true },
  { key: 'type', label: 'Alert Type', type: 'select', options: ['Emergency', 'Warning', 'Advisory', 'Information', 'All Clear', 'Lockdown', 'Evacuation'] },
  { key: 'priority', label: 'Priority', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Scheduled', 'Cancelled'] },
  { key: 'audience', label: 'Target Audience', type: 'select', options: ['All', 'Staff', 'Parents', 'Students', 'Emergency Services', 'Administration'] },
  { key: 'channels', label: 'Channels', type: 'select', options: ['Email', 'SMS', 'Push Notification', 'PA System', 'All Channels'] },
  { key: 'scheduledFor', label: 'Scheduled For', type: 'date' },
  { key: 'expiresAt', label: 'Expires At', type: 'date' },
];

function CommunicationAlerts({ token }) {
  return (
    <FeaturePage
      title="Communication Alerts"
      subtitle="Send and manage safety communications and alerts"
      apiEndpoint="alerts"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaBullhorn}
    />
  );
}

export default CommunicationAlerts;
