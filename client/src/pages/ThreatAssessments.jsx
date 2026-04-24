import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'createdAt', label: 'Date' },
];

const formFields = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'type', label: 'Threat Type', type: 'select', options: ['Physical', 'Verbal', 'Written', 'Online', 'Behavioral', 'Environmental', 'Other'] },
  { key: 'severity', label: 'Severity', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under Review', 'In Progress', 'Resolved', 'Closed'] },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'reportedBy', label: 'Reported By', type: 'text' },
  { key: 'targetIndividual', label: 'Target Individual', type: 'text' },
  { key: 'suspectDescription', label: 'Suspect Description', type: 'textarea' },
  { key: 'actionTaken', label: 'Action Taken', type: 'textarea' },
];

function ThreatAssessments({ token }) {
  return (
    <FeaturePage
      title="Threat Assessments"
      subtitle="Monitor and assess potential threats to school safety"
      apiEndpoint="threats"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaExclamationTriangle}
    />
  );
}

export default ThreatAssessments;
