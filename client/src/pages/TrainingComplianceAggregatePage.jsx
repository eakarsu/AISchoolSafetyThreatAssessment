import React, { useState } from 'react';
import { FaGraduationCap, FaPaperPlane } from 'react-icons/fa';
import AIResponseDisplay from '../components/AIResponseDisplay';

function TrainingComplianceAggregatePage({ token }) {
  const [roleFocus, setRoleFocus] = useState('all staff');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai-center/training-compliance-aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role_focus: roleFocus }),
      });
      const data = await res.json();
      if (res.status === 503) throw new Error(data.error || 'AI service unavailable: API key not configured');
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data.compliance || data);
    } catch (err) {
      setError(err.message || 'Aggregation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaGraduationCap style={{ color: '#059669' }} /> Training Compliance Aggregate
        </h1>
        <p style={{ color: '#6b7280' }}>Role-based training compliance aggregation with gaps and 30-day actions.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Role focus</label>
          <input style={inputStyle} value={roleFocus} onChange={e => setRoleFocus(e.target.value)} placeholder="all staff | teachers | admin | sros" />
        </div>
        {error && <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={btnStyle(loading)}>
          <FaPaperPlane /> {loading ? 'Aggregating...' : 'Aggregate Compliance'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Compliance Result</h2>
          <AIResponseDisplay data={result} />
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const btnStyle = (loading) => ({ marginTop: 16, padding: '10px 18px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 });

export default TrainingComplianceAggregatePage;
