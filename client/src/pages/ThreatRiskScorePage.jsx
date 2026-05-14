import React, { useState } from 'react';
import { FaChartLine, FaPaperPlane } from 'react-icons/fa';
import AIResponseDisplay from '../components/AIResponseDisplay';

function ThreatRiskScorePage({ token }) {
  const [subjectName, setSubjectName] = useState('');
  const [contextSummary, setContextSummary] = useState('');
  const [behaviors, setBehaviors] = useState('');
  const [stressors, setStressors] = useState('');
  const [accessToWeapons, setAccessToWeapons] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!contextSummary.trim()) {
      setError('Please describe the situation or threat context.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai-center/threat-risk-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectName,
          contextSummary,
          behaviors,
          stressors,
          accessToWeapons,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data.score || data.analysis || data);
    } catch (err) {
      setError(err.message || 'Risk scoring failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaChartLine style={{ color: '#dc2626' }} /> Threat Risk Score
        </h1>
        <p style={{ color: '#6b7280' }}>NTAC-aligned severity score with triage actions and owner assignment.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Subject (optional)</label>
            <input style={inputStyle} value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="Anonymous OK" />
          </div>
          <div>
            <label style={labelStyle}>Access to weapons</label>
            <select style={inputStyle} value={accessToWeapons} onChange={e => setAccessToWeapons(e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="none">None</option>
              <option value="possible">Possible</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Context summary</label>
          <textarea style={inputStyle} rows={5} value={contextSummary} onChange={e => setContextSummary(e.target.value)} placeholder="Describe what was reported, when, where, and by whom..." />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Behaviors of concern</label>
          <textarea style={inputStyle} rows={3} value={behaviors} onChange={e => setBehaviors(e.target.value)} placeholder="Recent escalation, leakage, target selection, etc." />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Stressors</label>
          <textarea style={inputStyle} rows={3} value={stressors} onChange={e => setStressors(e.target.value)} placeholder="Family, peer, academic, mental health stressors..." />
        </div>

        {error && <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 16,
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FaPaperPlane /> {loading ? 'Scoring...' : 'Score Threat'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Risk Score</h2>
          <AIResponseDisplay data={result} />
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };

export default ThreatRiskScorePage;
