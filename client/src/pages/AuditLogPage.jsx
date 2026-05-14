import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function AuditLogPage({ token }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const load = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/audit-log?page=${p}&limit=20`, { headers });
      if (res.status === 403) {
        setError('Admin access required to view audit logs.');
        return;
      }
      const data = await res.json();
      setLogs(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError('Error loading audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const actionColors = {
    READ: '#3b82f6',
    AI_ANALYZE: '#8b5cf6',
    CREATE: '#22c55e',
    UPDATE: '#f59e0b',
    DELETE: '#ef4444',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>FERPA Audit Log</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>All access to student-related records is logged here for compliance.</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8, padding: 16, color: '#991b1b', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading audit log...</div>
      ) : (
        <>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Time', 'User ID', 'Action', 'Resource', 'Resource ID', 'Details'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{log.user_id}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: actionColors[log.action] || '#6b7280', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{log.resource}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{log.resource_id || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', maxWidth: 200 }}>
                      {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details).substring(0, 60) : String(log.details).substring(0, 60)) : '—'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No audit log entries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff' }}>
                Previous
              </button>
              <span style={{ padding: '6px 12px', fontSize: 13 }}>Page {page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff' }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AuditLogPage;
