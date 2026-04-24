import React from 'react';
import { FaBrain } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'studentName', label: 'Student' },
  { key: 'behaviorType', label: 'Behavior Type' },
  { key: 'riskLevel', label: 'Risk Level' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date' },
];

const formFields = [
  { key: 'studentName', label: 'Student Name', type: 'text', required: true },
  { key: 'studentId', label: 'Student ID', type: 'text' },
  { key: 'grade', label: 'Grade', type: 'text' },
  { key: 'behaviorType', label: 'Behavior Type', type: 'select', options: ['Aggression', 'Withdrawal', 'Self-harm', 'Substance Use', 'Defiance', 'Anxiety', 'Depression', 'Violent Ideation', 'Other'] },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under Review', 'Monitoring', 'Resolved', 'Closed'] },
  { key: 'triggers', label: 'Known Triggers', type: 'textarea' },
  { key: 'interventions', label: 'Interventions', type: 'textarea' },
  { key: 'reportedBy', label: 'Reported By', type: 'text' },
  { key: 'parentNotified', label: 'Parent Notified', type: 'boolean' },
];

function BehavioralAnalysis({ token }) {
  return (
    <FeaturePage
      title="Behavioral Analysis"
      subtitle="Track and analyze student behavioral patterns"
      apiEndpoint="behavioral"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaBrain}
    />
  );
}

export default BehavioralAnalysis;
