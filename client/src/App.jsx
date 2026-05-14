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
import ThreatBoard from './pages/ThreatBoard';
import DrillSimulator from './pages/DrillSimulator';
import AuditLogPage from './pages/AuditLogPage';
import AnonymousTipForm from './pages/AnonymousTipForm';
import ThreatRiskScorePage from './pages/ThreatRiskScorePage';
import FirstResponderBriefPage from './pages/FirstResponderBriefPage';
import MentalHealthReferralPage from './pages/MentalHealthReferralPage';
import EmergencyReadinessPage from './pages/EmergencyReadinessPage';
import AnonymousTipTriagePage from './pages/AnonymousTipTriagePage';
import TrainingComplianceAggregatePage from './pages/TrainingComplianceAggregatePage';

// === Batch 07 Gaps & Frontend Mounts ===
import CfBehavioralIntelligencePlatform from './pages/CfBehavioralIntelligencePlatform';
import CfThreatSeverityScoring from './pages/CfThreatSeverityScoring';
import CfMentalHealthEarlyIdentification from './pages/CfMentalHealthEarlyIdentification';
import CfEmergencyPlaybookAutomation from './pages/CfEmergencyPlaybookAutomation';
import CfCommunityRiskMonitoring from './pages/CfCommunityRiskMonitoring';
import CfStaffTrainingPersonalization from './pages/CfStaffTrainingPersonalization';
import GapNoThreatriskscoreSeverityAi from './pages/GapNoThreatriskscoreSeverityAi';
import GapNoBehavioralpatterndetection from './pages/GapNoBehavioralpatterndetection';
import GapNoBullyingdetectionFromTextcommunication from './pages/GapNoBullyingdetectionFromTextcommunication';
import GapNoEmergencyreadinessassessment from './pages/GapNoEmergencyreadinessassessment';
import GapNoFirstresponderbriefAutogeneration from './pages/GapNoFirstresponderbriefAutogeneration';
import GapNoMentalhealthreferralAiTriage from './pages/GapNoMentalhealthreferralAiTriage';
import GapLimitedAnonymousReportingTipsRouteExist from './pages/GapLimitedAnonymousReportingTipsRouteExist';
import GapNoSospanicAlertSystemIntegration from './pages/GapNoSospanicAlertSystemIntegration';
import GapNoMassnotificationSmsvoiceEmergencyComms from './pages/GapNoMassnotificationSmsvoiceEmergencyComms';
import GapNoFirstresponderIntegrationCadPush from './pages/GapNoFirstresponderIntegrationCadPush';
import GapNoSisStudentInformationSystemIntegratio from './pages/GapNoSisStudentInformationSystemIntegratio';
import GapLimitedTrainingComplianceTracking from './pages/GapLimitedTrainingComplianceTracking';
// === End Batch 07 ===


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

  // Public routes - anonymous tip form accessible without login
  if (window.location.pathname === '/submit-tip') {
    return <AnonymousTipForm />;
  }

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
          <Route path="/threat-board" element={<ThreatBoard token={token} />} />
          <Route path="/drill-simulation" element={<DrillSimulator token={token} />} />
          <Route path="/audit-log" element={<AuditLogPage token={token} />} />
          <Route path="/threat-risk-score" element={<ThreatRiskScorePage token={token} />} />
          <Route path="/first-responder-brief" element={<FirstResponderBriefPage token={token} />} />
          <Route path="/mental-health-referral" element={<MentalHealthReferralPage token={token} />} />
          <Route path="/emergency-readiness" element={<EmergencyReadinessPage token={token} />} />
          <Route path="/anonymous-tip-triage" element={<AnonymousTipTriagePage token={token} />} />
          <Route path="/training-compliance" element={<TrainingComplianceAggregatePage token={token} />} />
          <Route path="*" element={<Navigate to="/" />} />
          // === Batch 07 Gaps & Frontend Mounts ===
          <Route path='/cf-behavioral-intelligence-platform' element={<CfBehavioralIntelligencePlatform />} />
          <Route path='/cf-threat-severity-scoring' element={<CfThreatSeverityScoring />} />
          <Route path='/cf-mental-health-early-identification' element={<CfMentalHealthEarlyIdentification />} />
          <Route path='/cf-emergency-playbook-automation' element={<CfEmergencyPlaybookAutomation />} />
          <Route path='/cf-community-risk-monitoring' element={<CfCommunityRiskMonitoring />} />
          <Route path='/cf-staff-training-personalization' element={<CfStaffTrainingPersonalization />} />
          <Route path='/gap-no-threatriskscore-severity-ai' element={<GapNoThreatriskscoreSeverityAi />} />
          <Route path='/gap-no-behavioralpatterndetection' element={<GapNoBehavioralpatterndetection />} />
          <Route path='/gap-no-bullyingdetection-from-textcommunication' element={<GapNoBullyingdetectionFromTextcommunication />} />
          <Route path='/gap-no-emergencyreadinessassessment' element={<GapNoEmergencyreadinessassessment />} />
          <Route path='/gap-no-firstresponderbrief-autogeneration' element={<GapNoFirstresponderbriefAutogeneration />} />
          <Route path='/gap-no-mentalhealthreferral-ai-triage' element={<GapNoMentalhealthreferralAiTriage />} />
          <Route path='/gap-limited-anonymous-reporting-tips-route-exist' element={<GapLimitedAnonymousReportingTipsRouteExist />} />
          <Route path='/gap-no-sospanic-alert-system-integration' element={<GapNoSospanicAlertSystemIntegration />} />
          <Route path='/gap-no-massnotification-smsvoice-emergency-comms' element={<GapNoMassnotificationSmsvoiceEmergencyComms />} />
          <Route path='/gap-no-firstresponder-integration-cad-push' element={<GapNoFirstresponderIntegrationCadPush />} />
          <Route path='/gap-no-sis-student-information-system-integratio' element={<GapNoSisStudentInformationSystemIntegratio />} />
          <Route path='/gap-limited-training-compliance-tracking' element={<GapLimitedTrainingComplianceTracking />} />
          // === End Batch 07 ===
        </Routes>
      </main>
    </div>
  );
}

export default App;
