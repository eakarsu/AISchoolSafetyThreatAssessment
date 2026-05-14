import React, { useState } from 'react';
import { FaShieldAlt, FaPaperPlane } from 'react-icons/fa';
import AIResponseDisplay from '../components/AIResponseDisplay';

function FirstResponderBriefPage({ token }) {
  const [incidentType, setIncidentType] = useState('active_threat');
  const [location, setLocation] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [layoutNotes, setLayoutNotes] = useState('');
  const [hazards, setHazards] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!location.trim() || !currentStatus.trim()) {
      setError('Location and current status are required.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai-center/first-responder-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incidentType,
          location,
          studentCount: studentCount ? Number(studentCount) : undefined,
          layoutNotes,
          hazards,
          currentStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data.brief || data.analysis || data);
    } catch (err) {
      setError(err.message || 'Brief generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaShieldAlt style={{ color: '#1d4ed8' }} /> First Responder Brief
        </h1>
        <p style={{ color: '#6b7280' }}>Sub-60-second incident brief: layout, hazards, staging, communications.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Incident type</label>
            <select style={inputStyle} value={incidentType} onChange={e => setIncidentType(e.target.value)}>
              <option value="active_threat">Active Threat</option>
              <option value="weapon">Weapon Reported</option>
              <option value="medical">Medical Emergency</option>
              <option value="fire">Fire</option>
              <option value="lockdown">Lockdown</option>
              <option value="evacuation">Evacuation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Location *</label>
            <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="Building, floor, room..." />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Approx. student/staff count on site</label>
          <input type="number" min="0" style={inputStyle} value={studentCount} onChange={e => setStudentCount(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Layout notes</label>
          <textarea style={inputStyle} rows={3} value={layoutNotes} onChange={e => setLayoutNotes(e.target.value)} placeholder="Entries, blind spots, AED locations, fire panel..." />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Hazards</label>
          <textarea style={inputStyle} rows={2} value={hazards} onChange={e => setHazards(e.target.value)} placeholder="Chemicals, fuel, gas line, prior known threats..." />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Current status *</label>
          <textarea style={inputStyle} rows={3} value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} placeholder="Latest known facts, who's contained, who's missing..." />
        </div>

        {error && <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 16,
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FaPaperPlane /> {loading ? 'Generating...' : 'Generate Brief'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>First Responder Brief</h2>
          <AIResponseDisplay data={result} />
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };

export default FirstResponderBriefPage;
