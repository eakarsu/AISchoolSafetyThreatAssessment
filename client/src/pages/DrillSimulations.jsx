import React from 'react';
import { FaRunning } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Drill Title' },
  { key: 'type', label: 'Drill Type' },
  { key: 'status', label: 'Status' },
  { key: 'score', label: 'Score' },
  { key: 'date', label: 'Date' },
];

const formFields = [
  { key: 'title', label: 'Drill Title', type: 'text', required: true },
  { key: 'type', label: 'Drill Type', type: 'select', options: ['Fire Drill', 'Lockdown', 'Evacuation', 'Shelter-in-Place', 'Active Shooter', 'Earthquake', 'Tornado', 'Reunification', 'Other'] },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'] },
  { key: 'date', label: 'Drill Date', type: 'date' },
  { key: 'duration', label: 'Duration (minutes)', type: 'number' },
  { key: 'participants', label: 'Participants', type: 'text' },
  { key: 'score', label: 'Performance Score (0-100)', type: 'number' },
  { key: 'observations', label: 'Observations', type: 'textarea' },
  { key: 'improvements', label: 'Areas for Improvement', type: 'textarea' },
  { key: 'coordinator', label: 'Coordinator', type: 'text' },
];

function DrillSimulations({ token }) {
  return (
    <FeaturePage
      title="Drill Simulations"
      subtitle="Plan, execute, and evaluate safety drills"
      apiEndpoint="drills"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaRunning}
    />
  );
}

export default DrillSimulations;
