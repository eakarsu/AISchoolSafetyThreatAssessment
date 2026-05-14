import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STATUSES = ['reported', 'investigating', 'escalated', 'resolved'];
const STATUS_COLORS = {
  reported: '#f59e0b',
  investigating: '#3b82f6',
  escalated: '#ef4444',
  resolved: '#22c55e',
};

function ThreatBoard({ token }) {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/threats?limit=100`, { headers });
      const data = await res.json();
      setThreats(data.data || data || []);
    } catch (err) {
      setMessage('Error loading threats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API}/threats/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessage(`Threat status updated to "${newStatus}"`);
        load();
      } else {
        const err = await res.json();
        setMessage(err.error || 'Update failed');
      }
    } catch (err) {
      setMessage('Error updating status');
    } finally {
      setUpdating(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = threats.filter(t => (t.status || 'reported') === s);
    return acc;
  }, {});

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Threat Status Board</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>Kanban-style threat triage workflow</p>
        </div>
        {message && (
          <div style={{ background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: 8, padding: '8px 16px', color: '#166534' }}>
            {message}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {STATUSES.map(status => (
          <div key={status} style={{ background: '#f8fafc', borderRadius: 12, padding: 16, minHeight: 300 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
              borderBottom: `3px solid ${STATUS_COLORS[status]}`, paddingBottom: 12
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[status] }} />
              <h3 style={{ margin: 0, fontSize: 14, textTransform: 'capitalize', fontWeight: 700 }}>{status}</h3>
              <span style={{ marginLeft: 'auto', background: STATUS_COLORS[status], color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                {byStatus[status].length}
              </span>
            </div>

            {byStatus[status].map(threat => (
              <div key={threat.id} style={{
                background: '#fff', borderRadius: 8, padding: 12, marginBottom: 12,
                border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{threat.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{threat.location}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {STATUSES.filter(s => s !== status).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(threat.id, s)}
                      disabled={updating === threat.id}
                      style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 4,
                        border: `1px solid ${STATUS_COLORS[s]}`, background: 'transparent',
                        color: STATUS_COLORS[s], cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {updating === threat.id ? '...' : `Move to ${s}`}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {byStatus[status].length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 32 }}>No threats</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThreatBoard;
