import React from 'react';
import { FaFirstAid } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Plan Title' },
  { key: 'type', label: 'Emergency Type' },
  { key: 'status', label: 'Status' },
  { key: 'lastReviewed', label: 'Last Reviewed' },
  { key: 'createdAt', label: 'Created' },
];

const formFields = [
  { key: 'title', label: 'Plan Title', type: 'text', required: true },
  { key: 'type', label: 'Emergency Type', type: 'select', options: ['Fire', 'Lockdown', 'Active Shooter', 'Natural Disaster', 'Bomb Threat', 'Medical Emergency', 'Chemical Spill', 'Evacuation', 'Other'] },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'procedures', label: 'Procedures', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Under Review', 'Draft', 'Archived'] },
  { key: 'assignedTeam', label: 'Assigned Team', type: 'text' },
  { key: 'contactInfo', label: 'Emergency Contacts', type: 'textarea' },
  { key: 'evacuationRoutes', label: 'Evacuation Routes', type: 'textarea' },
  { key: 'lastReviewed', label: 'Last Reviewed Date', type: 'date' },
];

function EmergencyPlans({ token }) {
  return (
    <FeaturePage
      title="Emergency Plans"
      subtitle="Manage emergency response plans and procedures"
      apiEndpoint="emergency"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaFirstAid}
    />
  );
}

export default EmergencyPlans;
