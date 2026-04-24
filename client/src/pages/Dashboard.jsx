import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaExclamationTriangle, FaClipboardList, FaEnvelopeOpenText, FaRunning,
  FaDoorOpen, FaCrosshairs, FaBrain, FaHeartbeat, FaHandPaper,
  FaUsers, FaFirstAid, FaClipboardCheck, FaGraduationCap,
  FaBullhorn, FaIdBadge, FaShieldAlt
} from 'react-icons/fa';

const sections = [
  { key: 'threats', label: 'Threat Assessments', icon: FaExclamationTriangle, color: 'red', path: '/threats' },
  { key: 'incidents', label: 'Incident Reports', icon: FaClipboardList, color: 'amber', path: '/incidents' },
  { key: 'tips', label: 'Anonymous Tips', icon: FaEnvelopeOpenText, color: 'purple', path: '/tips' },
  { key: 'drills', label: 'Drill Simulations', icon: FaRunning, color: 'blue', path: '/drills' },
  { key: 'access-control', label: 'Access Control', icon: FaDoorOpen, color: 'green', path: '/access-control' },
  { key: 'weapons', label: 'Weapon Detection', icon: FaCrosshairs, color: 'red', path: '/weapons' },
  { key: 'behavioral', label: 'Behavioral Analysis', icon: FaBrain, color: 'purple', path: '/behavioral' },
  { key: 'mental-health', label: 'Mental Health', icon: FaHeartbeat, color: 'green', path: '/mental-health' },
  { key: 'bullying', label: 'Bullying Detection', icon: FaHandPaper, color: 'amber', path: '/bullying' },
  { key: 'community', label: 'Community Risk', icon: FaUsers, color: 'blue', path: '/community' },
  { key: 'emergency', label: 'Emergency Plans', icon: FaFirstAid, color: 'red', path: '/emergency' },
  { key: 'audits', label: 'Safety Audits', icon: FaClipboardCheck, color: 'green', path: '/audits' },
  { key: 'training', label: 'Training Programs', icon: FaGraduationCap, color: 'blue', path: '/training' },
  { key: 'alerts', label: 'Communication Alerts', icon: FaBullhorn, color: 'amber', path: '/alerts' },
  { key: 'visitors', label: 'Visitor Screening', icon: FaIdBadge, color: 'purple', path: '/visitors' },
];

function Dashboard({ token }) {
  const [counts, setCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      const results = {};
      await Promise.all(
        sections.map(async (s) => {
          try {
            const res = await fetch(`/api/${s.key}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              results[s.key] = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
            } else {
              results[s.key] = 0;
            }
          } catch {
            results[s.key] = 0;
          }
        })
      );
      setCounts(results);
    };
    fetchCounts();
  }, [token]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <div className="dashboard-welcome">
        <h2>Safety Dashboard</h2>
        <p>{today}</p>
      </div>

      <div className="dashboard-grid">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.key}
              className={`stat-card ${section.color}`}
              onClick={() => navigate(section.path)}
            >
              <div className="stat-icon"><Icon /></div>
              <div className="stat-value">{counts[section.key] ?? '...'}</div>
              <div className="stat-label">{section.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
