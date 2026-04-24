import React from 'react';
import { FaHeartbeat } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'studentName', label: 'Student' },
  { key: 'concern', label: 'Concern' },
  { key: 'riskLevel', label: 'Risk Level' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date' },
];

const formFields = [
  { key: 'studentName', label: 'Student Name', type: 'text', required: true },
  { key: 'studentId', label: 'Student ID', type: 'text' },
  { key: 'grade', label: 'Grade', type: 'text' },
  { key: 'concern', label: 'Primary Concern', type: 'select', options: ['Anxiety', 'Depression', 'Self-harm', 'Suicidal Ideation', 'Eating Disorder', 'Trauma/PTSD', 'Substance Abuse', 'Grief', 'Social Isolation', 'Other'] },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under Review', 'In Treatment', 'Monitoring', 'Resolved', 'Closed'] },
  { key: 'symptoms', label: 'Observed Symptoms', type: 'textarea' },
  { key: 'interventions', label: 'Interventions', type: 'textarea' },
  { key: 'counselor', label: 'Assigned Counselor', type: 'text' },
  { key: 'referrals', label: 'External Referrals', type: 'textarea' },
  { key: 'parentNotified', label: 'Parent Notified', type: 'boolean' },
];

function MentalHealth({ token }) {
  return (
    <FeaturePage
      title="Mental Health"
      subtitle="Monitor and support student mental health and wellness"
      apiEndpoint="mental-health"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaHeartbeat}
    />
  );
}

export default MentalHealth;
