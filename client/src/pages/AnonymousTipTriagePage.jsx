import React, { useState } from 'react';
import { FaUserSecret, FaPaperPlane } from 'react-icons/fa';
import AIResponseDisplay from '../components/AIResponseDisplay';

function AnonymousTipTriagePage({ token }) {
  const [tipText, setTipText] = useState('');
  const [channel, setChannel] = useState('web');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!tipText.trim()) { setError('Tip text is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai-center/anonymous-tip-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tip_text: tipText, channel }),
      });
      const data = await res.json();
      if (res.status === 503) throw new Error(data.error || 'AI service unavailable: API key not configured');
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Triage failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaUserSecret style={{ color: '#7c3aed' }} /> Anonymous Tip Triage
        </h1>
        <p style={{ color: '#6b7280' }}>PII-separated triage of anonymous tip text — emails/phones are redacted before AI analysis.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Channel</label>
          <select style={inputStyle} value={channel} onChange={e => setChannel(e.target.value)}>
            <option value="web">Web form</option>
            <option value="phone">Phone</option>
            <option value="text">Text/SMS</option>
            <option value="in_person">In-person</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Tip text</label>
          <textarea style={inputStyle} rows={6} value={tipText} onChange={e => setTipText(e.target.value)} placeholder="Paste the anonymous tip here. Names, emails, and phone numbers will be redacted before AI triage." />
        </div>
        {error && <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={btnStyle(loading)}>
          <FaPaperPlane /> {loading ? 'Triaging...' : 'Triage Tip'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Triage Result</h2>
          <AIResponseDisplay data={result.triage || result} />
          {result.scrubbed_tip && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
              <strong>Scrubbed tip:</strong> {result.scrubbed_tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const btnStyle = (loading) => ({ marginTop: 16, padding: '10px 18px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 });

export default AnonymousTipTriagePage;
