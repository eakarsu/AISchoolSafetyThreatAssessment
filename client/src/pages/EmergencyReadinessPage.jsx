import React, { useState } from 'react';
import { FaShieldAlt, FaPaperPlane } from 'react-icons/fa';
import AIResponseDisplay from '../components/AIResponseDisplay';

function EmergencyReadinessPage({ token }) {
  const [schoolContext, setSchoolContext] = useState('');
  const [focus, setFocus] = useState('overall readiness');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai-center/emergency-readiness-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ school_context: schoolContext, focus }),
      });
      const data = await res.json();
      if (res.status === 503) throw new Error(data.error || 'AI service unavailable: API key not configured');
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data.assessment || data);
    } catch (err) {
      setError(err.message || 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaShieldAlt style={{ color: '#2563eb' }} /> Emergency Readiness Assessment
        </h1>
        <p style={{ color: '#6b7280' }}>Audit drills, training, and protocols against best practice.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ marginTop: 4 }}>
          <label style={labelStyle}>School context</label>
          <textarea style={inputStyle} rows={3} value={schoolContext} onChange={e => setSchoolContext(e.target.value)} placeholder="K-12 campus, single-building, ~800 students" />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Focus area</label>
          <input style={inputStyle} value={focus} onChange={e => setFocus(e.target.value)} />
        </div>
        {error && <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={btnStyle(loading)}>
          <FaPaperPlane /> {loading ? 'Assessing...' : 'Run Assessment'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Readiness Result</h2>
          <AIResponseDisplay data={result} />
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const btnStyle = (loading) => ({ marginTop: 16, padding: '10px 18px', background: 'linear-gradient(135deg, #2563eb, #1e40af)', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 });

export default EmergencyReadinessPage;
