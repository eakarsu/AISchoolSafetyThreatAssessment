import React from 'react';
import { FaUsers } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'title', label: 'Risk Factor' },
  { key: 'category', label: 'Category' },
  { key: 'riskLevel', label: 'Risk Level' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Identified' },
];

const formFields = [
  { key: 'title', label: 'Risk Factor Title', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['Crime Rate', 'Gang Activity', 'Drug Activity', 'Sex Offenders', 'Domestic Violence', 'Homelessness', 'Traffic Safety', 'Environmental Hazard', 'Social Media Threat', 'Other'] },
  { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Monitoring', 'Mitigated', 'Resolved'] },
  { key: 'affectedArea', label: 'Affected Area', type: 'text' },
  { key: 'proximity', label: 'Proximity to School', type: 'select', options: ['On Campus', 'Adjacent', 'Within 1 mile', 'Within 5 miles', 'Community-wide'] },
  { key: 'source', label: 'Information Source', type: 'text' },
  { key: 'mitigationPlan', label: 'Mitigation Plan', type: 'textarea' },
  { key: 'partnerAgencies', label: 'Partner Agencies', type: 'textarea' },
];

function CommunityRisk({ token }) {
  return (
    <FeaturePage
      title="Community Risk"
      subtitle="Assess and monitor community risk factors affecting school safety"
      apiEndpoint="community"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaUsers}
    />
  );
}

export default CommunityRisk;
