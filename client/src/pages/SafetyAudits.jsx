import React from 'react';
import { FaClipboardCheck } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Audit Title' },
  { key: 'area', label: 'Area' },
  { key: 'status', label: 'Status' },
  { key: 'score', label: 'Score' },
  { key: 'date', label: 'Audit Date' },
];

const formFields = [
  { key: 'title', label: 'Audit Title', type: 'text', required: true },
  { key: 'area', label: 'Area', type: 'select', options: ['Building Exterior', 'Classrooms', 'Hallways', 'Cafeteria', 'Gymnasium', 'Playground', 'Parking Lot', 'Administrative', 'Technology', 'Full Campus'] },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Completed', 'Follow-up Required'] },
  { key: 'score', label: 'Score (0-100)', type: 'number' },
  { key: 'findings', label: 'Findings', type: 'textarea' },
  { key: 'recommendations', label: 'Recommendations', type: 'textarea' },
  { key: 'auditor', label: 'Auditor', type: 'text' },
  { key: 'date', label: 'Audit Date', type: 'date' },
  { key: 'nextAuditDate', label: 'Next Audit Date', type: 'date' },
];

function SafetyAudits({ token }) {
  return (
    <FeaturePage
      title="Safety Audits"
      subtitle="Conduct and track safety compliance audits"
      apiEndpoint="audits"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaClipboardCheck}
    />
  );
}

export default SafetyAudits;
