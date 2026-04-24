import React from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Program Title' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'targetAudience', label: 'Audience' },
  { key: 'date', label: 'Date' },
];

const formFields = [
  { key: 'title', label: 'Program Title', type: 'text', required: true },
  { key: 'type', label: 'Training Type', type: 'select', options: ['Active Shooter', 'First Aid/CPR', 'Fire Safety', 'Bullying Prevention', 'Mental Health', 'De-escalation', 'Lockdown Procedures', 'Threat Recognition', 'Other'] },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'] },
  { key: 'targetAudience', label: 'Target Audience', type: 'select', options: ['All Staff', 'Teachers', 'Administrators', 'Security', 'Students', 'Parents', 'Combined'] },
  { key: 'instructor', label: 'Instructor', type: 'text' },
  { key: 'date', label: 'Training Date', type: 'date' },
  { key: 'duration', label: 'Duration (hours)', type: 'number' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'capacity', label: 'Capacity', type: 'number' },
  { key: 'materials', label: 'Materials Required', type: 'textarea' },
];

function TrainingPrograms({ token }) {
  return (
    <FeaturePage
      title="Training Programs"
      subtitle="Manage safety training and certification programs"
      apiEndpoint="training"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaGraduationCap}
    />
  );
}

export default TrainingPrograms;
