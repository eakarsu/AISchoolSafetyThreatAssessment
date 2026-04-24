import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaChartLine, FaFileAlt, FaSearch, FaLayerGroup } from 'react-icons/fa';
import AIResponseDisplay from '../components/AIResponseDisplay';

const tabs = [
  { key: 'chat', label: 'Chat', icon: FaRobot },
  { key: 'risk', label: 'Risk Prediction', icon: FaChartLine },
  { key: 'report', label: 'Generate Report', icon: FaFileAlt },
  { key: 'pattern', label: 'Pattern Recognition', icon: FaSearch },
  { key: 'batch', label: 'Batch Analysis', icon: FaLayerGroup },
];

function AICenter({ token }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am the AI Safety Assistant. I can help you analyze threats, predict risks, generate reports, and identify patterns across your school safety data. How can I assist you today?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const messagesEndRef = useRef(null);

  // Form states
  const [riskForm, setRiskForm] = useState({ timeframe: '30', scope: 'all' });
  const [reportForm, setReportForm] = useState({ type: 'comprehensive', startDate: '', endDate: '' });
  const [patternForm, setPatternForm] = useState({ dataSource: 'threats', timeRange: '90' });
  const [batchForm, setBatchForm] = useState({ featureType: 'threats' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai-center/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      const aiReply = data.response || data.message || data.result || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: 'ai', content: aiReply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'I apologize, but I encountered an error processing your request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const runRiskPrediction = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai-center/risk-predict', {
        method: 'POST',
        headers,
        body: JSON.stringify(riskForm),
      });
      const data = await res.json();
      setResult(data.analysis || data.result || data.prediction || data);
    } catch {
      setResult('Risk prediction is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai-center/generate-report', {
        method: 'POST',
        headers,
        body: JSON.stringify(reportForm),
      });
      const data = await res.json();
      setResult(data.report || data.result || data);
    } catch {
      setResult('Report generation is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const runPatternRecognition = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai-center/pattern-recognition', {
        method: 'POST',
        headers,
        body: JSON.stringify(patternForm),
      });
      const data = await res.json();
      setResult(data.patterns || data.result || data);
    } catch {
      setResult('Pattern recognition is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const runBatchAnalysis = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai-center/batch-analysis', {
        method: 'POST',
        headers,
        body: JSON.stringify(batchForm),
      });
      const data = await res.json();
      setResult(data.analysis || data.results || data);
    } catch {
      setResult('Batch analysis is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Safety Center</h2>
          <p>Advanced AI-powered safety analysis and insights</p>
        </div>
      </div>

      <div className="ai-center-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`ai-center-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setResult(null); }}
            >
              <Icon style={{ marginRight: '6px' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="ai-chat-container">
          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div className={`ai-chat-message ${msg.role}`} key={i}>
                <div className="message-avatar">
                  {msg.role === 'user' ? 'U' : <FaRobot />}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="ai-chat-message ai">
                <div className="message-avatar"><FaRobot /></div>
                <div className="message-content">
                  <div className="ai-loading" style={{ padding: '4px 0' }}>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-chat-input">
            <input
              type="text"
              className="form-control"
              placeholder="Ask about school safety, threats, risk analysis..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="btn btn-ai" onClick={sendChat} disabled={loading}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      {/* Risk Prediction Tab */}
      {activeTab === 'risk' && (
        <div className="ai-panel">
          <h3>Risk Prediction Analysis</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            Predict potential safety risks based on historical data and current conditions.
          </p>
          <div className="ai-panel form-row">
            <div className="form-group">
              <label>Timeframe (days)</label>
              <select
                className="form-control"
                value={riskForm.timeframe}
                onChange={(e) => setRiskForm({ ...riskForm, timeframe: e.target.value })}
              >
                <option value="7">Next 7 days</option>
                <option value="14">Next 14 days</option>
                <option value="30">Next 30 days</option>
                <option value="90">Next 90 days</option>
              </select>
            </div>
            <div className="form-group">
              <label>Scope</label>
              <select
                className="form-control"
                value={riskForm.scope}
                onChange={(e) => setRiskForm({ ...riskForm, scope: e.target.value })}
              >
                <option value="all">All Areas</option>
                <option value="threats">Threats</option>
                <option value="incidents">Incidents</option>
                <option value="behavioral">Behavioral</option>
                <option value="bullying">Bullying</option>
                <option value="mental-health">Mental Health</option>
              </select>
            </div>
          </div>
          <button className="btn btn-ai" onClick={runRiskPrediction} disabled={loading} style={{ marginTop: '8px' }}>
            <FaChartLine /> Run Risk Prediction
          </button>
          <AIResponseDisplay response={result} loading={loading} />
        </div>
      )}

      {/* Report Generation Tab */}
      {activeTab === 'report' && (
        <div className="ai-panel">
          <h3>AI Report Generation</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            Generate comprehensive safety reports powered by AI analysis.
          </p>
          <div className="form-group">
            <label>Report Type</label>
            <select
              className="form-control"
              value={reportForm.type}
              onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
            >
              <option value="comprehensive">Comprehensive Safety Report</option>
              <option value="threat">Threat Assessment Summary</option>
              <option value="incident">Incident Analysis Report</option>
              <option value="behavioral">Behavioral Trends Report</option>
              <option value="compliance">Compliance & Audit Report</option>
              <option value="drill">Drill Performance Report</option>
            </select>
          </div>
          <div className="ai-panel form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="form-control"
                value={reportForm.startDate}
                onChange={(e) => setReportForm({ ...reportForm, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                className="form-control"
                value={reportForm.endDate}
                onChange={(e) => setReportForm({ ...reportForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-ai" onClick={generateReport} disabled={loading} style={{ marginTop: '8px' }}>
            <FaFileAlt /> Generate Report
          </button>
          <AIResponseDisplay response={result} loading={loading} />
        </div>
      )}

      {/* Pattern Recognition Tab */}
      {activeTab === 'pattern' && (
        <div className="ai-panel">
          <h3>Pattern Recognition</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            Identify hidden patterns and trends across safety data using AI.
          </p>
          <div className="ai-panel form-row">
            <div className="form-group">
              <label>Data Source</label>
              <select
                className="form-control"
                value={patternForm.dataSource}
                onChange={(e) => setPatternForm({ ...patternForm, dataSource: e.target.value })}
              >
                <option value="threats">Threats</option>
                <option value="incidents">Incidents</option>
                <option value="behavioral">Behavioral</option>
                <option value="bullying">Bullying</option>
                <option value="tips">Anonymous Tips</option>
                <option value="all">All Data Sources</option>
              </select>
            </div>
            <div className="form-group">
              <label>Time Range (days)</label>
              <select
                className="form-control"
                value={patternForm.timeRange}
                onChange={(e) => setPatternForm({ ...patternForm, timeRange: e.target.value })}
              >
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
          <button className="btn btn-ai" onClick={runPatternRecognition} disabled={loading} style={{ marginTop: '8px' }}>
            <FaSearch /> Analyze Patterns
          </button>
          <AIResponseDisplay response={result} loading={loading} />
        </div>
      )}

      {/* Batch Analysis Tab */}
      {activeTab === 'batch' && (
        <div className="ai-panel">
          <h3>Batch Analysis</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            Run AI analysis across all records in a selected category.
          </p>
          <div className="form-group">
            <label>Feature Category</label>
            <select
              className="form-control"
              value={batchForm.featureType}
              onChange={(e) => setBatchForm({ ...batchForm, featureType: e.target.value })}
            >
              <option value="threats">Threat Assessments</option>
              <option value="incidents">Incident Reports</option>
              <option value="behavioral">Behavioral Analysis</option>
              <option value="bullying">Bullying Detection</option>
              <option value="mental-health">Mental Health</option>
              <option value="tips">Anonymous Tips</option>
              <option value="weapons">Weapon Detection</option>
              <option value="community">Community Risk</option>
            </select>
          </div>
          <button className="btn btn-ai" onClick={runBatchAnalysis} disabled={loading} style={{ marginTop: '8px' }}>
            <FaLayerGroup /> Run Batch Analysis
          </button>
          <AIResponseDisplay response={result} loading={loading} />
        </div>
      )}
    </div>
  );
}

export default AICenter;
