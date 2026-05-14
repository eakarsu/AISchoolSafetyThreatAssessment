import React, { useState } from 'react';
import { FaHeart, FaPaperPlane } from 'react-icons/fa';
import AIResponseDisplay from '../components/AIResponseDisplay';

function MentalHealthReferralPage({ token }) {
  const [studentAlias, setStudentAlias] = useState('');
  const [grade, setGrade] = useState('');
  const [observations, setObservations] = useState('');
  const [stressors, setStressors] = useState('');
  const [protectiveFactors, setProtectiveFactors] = useState('');
  const [riskLevel, setRiskLevel] = useState('low');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!observations.trim()) {
      setError('Please describe what was observed.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai-center/mental-health-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentAlias,
          grade,
          observations,
          stressors,
          protectiveFactors,
          riskLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data.referral || data.analysis || data);
    } catch (err) {
      setError(err.message || 'Referral generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaHeart style={{ color: '#db2777' }} /> Mental Health Referral
        </h1>
        <p style={{ color: '#6b7280' }}>Tiered support recommendation with referral types and urgency. Not a diagnosis.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Student alias / ID (optional)</label>
            <input style={inputStyle} value={studentAlias} onChange={e => setStudentAlias(e.target.value)} placeholder="Use a non-PII alias" />
          </div>
          <div>
            <label style={labelStyle}>Grade</label>
            <input style={inputStyle} value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. 9th" />
          </div>
          <div>
            <label style={labelStyle}>Concern level</label>
            <select style={inputStyle} value={riskLevel} onChange={e => setRiskLevel(e.target.value)}>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="imminent">Imminent</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Observations *</label>
          <textarea style={inputStyle} rows={5} value={observations} onChange={e => setObservations(e.target.value)} placeholder="Behaviors, mood changes, statements, attendance, drop in performance..." />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Stressors</label>
          <textarea style={inputStyle} rows={2} value={stressors} onChange={e => setStressors(e.target.value)} placeholder="Loss, family conflict, recent move, health, peer/social..." />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Protective factors</label>
          <textarea style={inputStyle} rows={2} value={protectiveFactors} onChange={e => setProtectiveFactors(e.target.value)} placeholder="Support systems, hobbies, trusted adults..." />
        </div>

        {error && <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 16,
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #db2777, #be185d)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FaPaperPlane /> {loading ? 'Generating...' : 'Generate Referral'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Tiered Support Recommendation</h2>
          <AIResponseDisplay data={result} />
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };

export default MentalHealthReferralPage;
