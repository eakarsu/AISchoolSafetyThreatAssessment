import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaClipboardList,
  FaDoorOpen,
  FaCrosshairs,
  FaBrain,
  FaHeartbeat,
  FaHandPaper,
  FaUsers,
  FaFirstAid,
  FaClipboardCheck,
  FaGraduationCap,
  FaRunning,
  FaBullhorn,
  FaEnvelopeOpenText,
  FaIdBadge,
  FaRobot,
  FaSignOutAlt,
} from 'react-icons/fa';

const navGroups = [
  {
    label: 'MONITORING',
    items: [
      { to: '/threats', icon: FaExclamationTriangle, text: 'Threat Assessments' },
      { to: '/incidents', icon: FaClipboardList, text: 'Incident Reports' },
      { to: '/access-control', icon: FaDoorOpen, text: 'Access Control' },
      { to: '/weapons', icon: FaCrosshairs, text: 'Weapon Detection' },
    ],
  },
  {
    label: 'ASSESSMENT',
    items: [
      { to: '/behavioral', icon: FaBrain, text: 'Behavioral Analysis' },
      { to: '/mental-health', icon: FaHeartbeat, text: 'Mental Health' },
      { to: '/bullying', icon: FaHandPaper, text: 'Bullying Detection' },
      { to: '/community', icon: FaUsers, text: 'Community Risk' },
    ],
  },
  {
    label: 'RESPONSE',
    items: [
      { to: '/emergency', icon: FaFirstAid, text: 'Emergency Plans' },
      { to: '/audits', icon: FaClipboardCheck, text: 'Safety Audits' },
      { to: '/training', icon: FaGraduationCap, text: 'Training Programs' },
      { to: '/drills', icon: FaRunning, text: 'Drill Simulations' },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      { to: '/alerts', icon: FaBullhorn, text: 'Communication Alerts' },
      { to: '/tips', icon: FaEnvelopeOpenText, text: 'Anonymous Tips' },
      { to: '/visitors', icon: FaIdBadge, text: 'Visitor Screening' },
    ],
  },
];

function Sidebar({ user, onLogout }) {
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'A';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <FaShieldAlt />
        </div>
        <div className="logo-text">
          <h1>AI School Safety</h1>
          <span>Threat Assessment System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-group">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="link-icon"><FaShieldAlt /></span>
            Dashboard
          </NavLink>
        </div>

        {navGroups.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon"><item.icon /></span>
                {item.text}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-group">
          <div className="sidebar-group-label">AI TOOLS</div>
          <NavLink
            to="/ai-center"
            className={({ isActive }) => `sidebar-link ai-special ${isActive ? 'active' : ''}`}
          >
            <span className="link-icon"><FaRobot /></span>
            AI Safety Center
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.name || 'Admin User'}</div>
            <div className="user-role">{user?.role || 'Administrator'}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          <FaSignOutAlt /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
