import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Public page - no login required
function AnonymousTipForm() {
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [tipId, setTipId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/tips/form`)
      .then(r => r.json())
      .then(data => {
        setFormFields(data.fields || []);
        const defaults = {};
        (data.fields || []).forEach(f => { defaults[f.key] = ''; });
        setFormData(defaults);
      })
      .catch(() => setError('Error loading form'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/tips/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setTipId(data.tipId);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ color: '#166534', marginBottom: 12 }}>Tip Submitted Anonymously</h2>
          <p style={{ color: '#374151', marginBottom: 8 }}>
            Thank you for helping keep our school safe. Your tip has been received and will be reviewed by our safety team.
          </p>
          <p style={{ color: '#64748b', fontSize: 13 }}>Reference ID: #{tipId}</p>
          <button
            onClick={() => { setSubmitted(false); setFormData({}); setTipId(null); }}
            style={{ marginTop: 24, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}
          >
            Submit Another Tip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 520, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
          <h2 style={{ margin: '0 0 8px', color: '#1e293b' }}>Anonymous Safety Tip</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Your identity is never recorded. All tips are treated confidentially.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8, padding: 12, color: '#991b1b', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {formFields.map(field => (
            <div key={field.key} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#374151' }}>
                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={e => setFormData(d => ({ ...d, [field.key]: e.target.value }))}
                  required={field.required}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
                >
                  <option value="">Select...</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={e => setFormData(d => ({ ...d, [field.key]: e.target.value }))}
                  required={field.required}
                  placeholder={field.placeholder || ''}
                  maxLength={field.maxLength}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, minHeight: 100, resize: 'vertical', boxSizing: 'border-box' }}
                />
              ) : (
                <input
                  type="text"
                  value={formData[field.key] || ''}
                  onChange={e => setFormData(d => ({ ...d, [field.key]: e.target.value }))}
                  required={field.required}
                  placeholder={field.placeholder || ''}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
              padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Submitting...' : 'Submit Tip Anonymously'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AnonymousTipForm;
