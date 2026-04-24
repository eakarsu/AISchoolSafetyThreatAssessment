import React from 'react';
import { FaEnvelopeOpenText } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'subject', label: 'Subject' },
  { key: 'category', label: 'Category' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Received' },
];

const formFields = [
  { key: 'subject', label: 'Subject', type: 'text', required: true },
  { key: 'message', label: 'Tip Message', type: 'textarea', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['Threat', 'Bullying', 'Drug/Alcohol', 'Weapon', 'Self-harm', 'Abuse', 'Vandalism', 'Suspicious Activity', 'Other'] },
  { key: 'severity', label: 'Severity', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['New', 'Under Review', 'Investigating', 'Resolved', 'Dismissed'] },
  { key: 'location', label: 'Location Referenced', type: 'text' },
  { key: 'personsInvolved', label: 'Persons Involved', type: 'textarea' },
  { key: 'actionTaken', label: 'Action Taken', type: 'textarea' },
];

function AnonymousTips({ token }) {
  return (
    <FeaturePage
      title="Anonymous Tips"
      subtitle="Manage and investigate anonymously submitted safety tips"
      apiEndpoint="tips"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaEnvelopeOpenText}
    />
  );
}

export default AnonymousTips;
