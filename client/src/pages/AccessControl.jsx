import React from 'react';
import { FaDoorOpen } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'name', label: 'Entry Point' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'accessLevel', label: 'Access Level' },
  { key: 'createdAt', label: 'Last Updated' },
];

const formFields = [
  { key: 'name', label: 'Entry Point Name', type: 'text', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['Main Entrance', 'Side Door', 'Emergency Exit', 'Loading Dock', 'Gate', 'Restricted Area', 'Classroom', 'Office', 'Other'] },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Maintenance', 'Locked', 'Open'] },
  { key: 'accessLevel', label: 'Access Level', type: 'select', options: ['Public', 'Staff Only', 'Admin Only', 'Restricted', 'Emergency Only'] },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'securityFeatures', label: 'Security Features', type: 'textarea' },
  { key: 'cameraId', label: 'Camera ID', type: 'text' },
  { key: 'lastInspection', label: 'Last Inspection Date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

function AccessControl({ token }) {
  return (
    <FeaturePage
      title="Access Control"
      subtitle="Manage building access points and security systems"
      apiEndpoint="access-control"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaDoorOpen}
    />
  );
}

export default AccessControl;
