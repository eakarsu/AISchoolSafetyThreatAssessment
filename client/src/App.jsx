import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ThreatAssessments from './pages/ThreatAssessments';
import IncidentReports from './pages/IncidentReports';
import BehavioralAnalysis from './pages/BehavioralAnalysis';
import EmergencyPlans from './pages/EmergencyPlans';
import VisitorScreening from './pages/VisitorScreening';
import SafetyAudits from './pages/SafetyAudits';
import TrainingPrograms from './pages/TrainingPrograms';
import BullyingDetection from './pages/BullyingDetection';
import MentalHealth from './pages/MentalHealth';
import AnonymousTips from './pages/AnonymousTips';
import DrillSimulations from './pages/DrillSimulations';
import AccessControl from './pages/AccessControl';
import CommunicationAlerts from './pages/CommunicationAlerts';
import WeaponDetection from './pages/WeaponDetection';
import CommunityRisk from './pages/CommunityRisk';
import AICenter from './pages/AICenter';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard token={token} />} />
          <Route path="/threats" element={<ThreatAssessments token={token} />} />
          <Route path="/incidents" element={<IncidentReports token={token} />} />
          <Route path="/behavioral" element={<BehavioralAnalysis token={token} />} />
          <Route path="/emergency" element={<EmergencyPlans token={token} />} />
          <Route path="/visitors" element={<VisitorScreening token={token} />} />
          <Route path="/audits" element={<SafetyAudits token={token} />} />
          <Route path="/training" element={<TrainingPrograms token={token} />} />
          <Route path="/bullying" element={<BullyingDetection token={token} />} />
          <Route path="/mental-health" element={<MentalHealth token={token} />} />
          <Route path="/tips" element={<AnonymousTips token={token} />} />
          <Route path="/drills" element={<DrillSimulations token={token} />} />
          <Route path="/access-control" element={<AccessControl token={token} />} />
          <Route path="/alerts" element={<CommunicationAlerts token={token} />} />
          <Route path="/weapons" element={<WeaponDetection token={token} />} />
          <Route path="/community" element={<CommunityRisk token={token} />} />
          <Route path="/ai-center" element={<AICenter token={token} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
