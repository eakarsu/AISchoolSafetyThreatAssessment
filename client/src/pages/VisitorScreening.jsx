import React from 'react';
import { FaIdBadge } from 'react-icons/fa';
import FeaturePage from '../components/FeaturePage';

const tableColumns = [
  { key: 'visitor_name', label: 'Visitor Name' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'host_staff', label: 'Host' },
  { key: 'id_verified', label: 'ID Verified' },
  { key: 'risk_score', label: 'Risk Score' },
  { key: 'created_at', label: 'Date' },
];

const formFields = [
  { key: 'visitorName', label: 'Visitor Name', type: 'text', required: true },
  { key: 'visitorId', label: 'ID Number', type: 'text' },
  { key: 'purpose', label: 'Purpose of Visit', type: 'select', options: ['Parent Meeting', 'Vendor', 'Contractor', 'Guest Speaker', 'Volunteer', 'Government Official', 'Other'] },
  { key: 'description', label: 'Details', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['Approved', 'Pending', 'Denied', 'Checked In', 'Checked Out', 'Flagged'] },
  { key: 'hostName', label: 'Host Name', type: 'text' },
  { key: 'date', label: 'Visit Date', type: 'date' },
  { key: 'checkInTime', label: 'Check-in Time', type: 'text' },
  { key: 'checkOutTime', label: 'Check-out Time', type: 'text' },
  { key: 'vehiclePlate', label: 'Vehicle Plate', type: 'text' },
  { key: 'backgroundCheck', label: 'Background Check Cleared', type: 'boolean' },
];

function VisitorScreening({ token }) {
  return (
    <FeaturePage
      title="Visitor Screening"
      subtitle="Screen and track all campus visitors"
      apiEndpoint="visitors"
      token={token}
      tableColumns={tableColumns}
      formFields={formFields}
      Icon={FaIdBadge}
    />
  );
}

export default VisitorScreening;
