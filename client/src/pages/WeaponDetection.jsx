import React from 'react';
import { FaCrosshairs } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Detection Event' },
  { key: 'weaponType', label: 'Weapon Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Detected' },
];

const formFields = [
  { key: 'title', label: 'Event Title', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'weaponType', label: 'Weapon Type', type: 'select', options: ['Firearm', 'Knife/Blade', 'Explosive', 'Chemical', 'Blunt Object', 'Replica/Toy', 'Suspicious Object', 'Other'] },
  { key: 'severity', label: 'Severity', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Under Review', 'Confiscated', 'False Alarm', 'Resolved'] },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'detectionMethod', label: 'Detection Method', type: 'select', options: ['Metal Detector', 'Visual Inspection', 'Camera/AI', 'Tip Report', 'Random Search', 'Other'] },
  { key: 'suspectName', label: 'Suspect Name', type: 'text' },
  { key: 'actionTaken', label: 'Action Taken', type: 'textarea' },
  { key: 'lawEnforcementNotified', label: 'Law Enforcement Notified', type: 'boolean' },
];

function WeaponDetection({ token }) {
  return (
    <FeaturePage
      title="Weapon Detection"
      subtitle="Track weapon detection events and responses"
      apiEndpoint="weapons"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaCrosshairs}
    />
  );
}

export default WeaponDetection;
