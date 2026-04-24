import React from 'react';
import { FaClipboardList } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'date', label: 'Date' },
];

const formFields = [
  { key: 'title', label: 'Incident Title', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'type', label: 'Incident Type', type: 'select', options: ['Violence', 'Theft', 'Vandalism', 'Drug/Alcohol', 'Harassment', 'Trespassing', 'Medical', 'Fire', 'Other'] },
  { key: 'severity', label: 'Severity', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under Review', 'In Progress', 'Resolved', 'Closed'] },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'date', label: 'Incident Date', type: 'date' },
  { key: 'reportedBy', label: 'Reported By', type: 'text' },
  { key: 'witnesses', label: 'Witnesses', type: 'textarea' },
  { key: 'actionTaken', label: 'Action Taken', type: 'textarea' },
  { key: 'injuries', label: 'Injuries', type: 'text' },
];

function IncidentReports({ token }) {
  return (
    <FeaturePage
      title="Incident Reports"
      subtitle="Document and track safety incidents"
      apiEndpoint="incidents"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaClipboardList}
    />
  );
}

export default IncidentReports;
