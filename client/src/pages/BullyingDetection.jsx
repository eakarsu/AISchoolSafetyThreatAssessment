import React from 'react';
import { FaHandPaper } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'victimName', label: 'Victim' },
  { key: 'bullyingType', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Reported' },
];

const formFields = [
  { key: 'victimName', label: 'Victim Name', type: 'text', required: true },
  { key: 'perpetratorName', label: 'Perpetrator Name', type: 'text' },
  { key: 'bullyingType', label: 'Bullying Type', type: 'select', options: ['Physical', 'Verbal', 'Social/Relational', 'Cyberbullying', 'Sexual', 'Racial', 'Other'] },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'severity', label: 'Severity', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under Review', 'In Progress', 'Resolved', 'Closed'] },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'witnesses', label: 'Witnesses', type: 'textarea' },
  { key: 'frequency', label: 'Frequency', type: 'select', options: ['One-time', 'Occasional', 'Regular', 'Daily'] },
  { key: 'actionTaken', label: 'Action Taken', type: 'textarea' },
  { key: 'parentNotified', label: 'Parents Notified', type: 'boolean' },
];

function BullyingDetection({ token }) {
  return (
    <FeaturePage
      title="Bullying Detection"
      subtitle="Identify, track, and resolve bullying incidents"
      apiEndpoint="bullying"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaHandPaper}
    />
  );
}

export default BullyingDetection;
