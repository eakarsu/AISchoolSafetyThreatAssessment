import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaRobot } from 'react-icons/fa';
import DetailModal from './DetailModal';
import NewItemModal from './NewItemModal';

function FeaturePage({ title, subtitle, apiEndpoint, token, tableColumns, formFields, detailFields, Icon }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/${apiEndpoint}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (formData) => {
    try {
      const res = await fetch(`/api/${apiEndpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowNew(false);
        fetchItems();
      }
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const handleEdit = async (updatedData) => {
    const id = updatedData._id || updatedData.id;
    try {
      const res = await fetch(`/api/${apiEndpoint}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        fetchItems();
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/${apiEndpoint}/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setSelectedItem(null);
        fetchItems();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAnalyze = async (item) => {
    const id = item._id || item.id;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`/api/${apiEndpoint}/${id}/analyze`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis || data.result || data);
      }
    } catch (err) {
      console.error('AI analyze error:', err);
      setAiAnalysis('Analysis temporarily unavailable. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const getBadgeClass = (value) => {
    if (!value) return '';
    const v = String(value).toLowerCase().replace(/[\s_]+/g, '-');
    return `badge badge-${v}`;
  };

  const isStatusField = (key) => {
    return ['status', 'severity', 'risk_level', 'riskLevel', 'threat_level', 'threatLevel', 'priority', 'level', 'risk'].includes(key);
  };

  // Compute simple stats
  const statusCounts = {};
  items.forEach((item) => {
    const statusField = tableColumns.find((c) => isStatusField(c.key));
    if (statusField) {
      const val = item[statusField.key] || 'Unknown';
      statusCounts[val] = (statusCounts[val] || 0) + 1;
    }
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <FaPlus /> New {title.replace(/s$/, '')}
        </button>
      </div>

      <div className="stats-bar">
        <div className="stats-bar stat-pill">
          <span className="stat-count">{items.length}</span> Total
        </div>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div className="stats-bar stat-pill" key={status}>
            <span className={getBadgeClass(status)}>{status}</span>
            <span className="stat-count">{count}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : items.length === 0 ? (
        <div className="table-container">
          <div className="empty-state">
            <div className="empty-icon">{Icon && <Icon />}</div>
            <h3>No {title} Found</h3>
            <p>Create your first entry to get started.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {tableColumns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id || item.id} onClick={() => { setSelectedItem(item); setAiAnalysis(null); }}>
                  {tableColumns.map((col) => (
                    <td key={col.key}>
                      {isStatusField(col.key) ? (
                        <span className={getBadgeClass(item[col.key])}>
                          {item[col.key] || '—'}
                        </span>
                      ) : col.key === 'createdAt' || col.key === 'date' || col.key === 'created_at' ? (
                        item[col.key] ? new Date(item[col.key]).toLocaleDateString() : '—'
                      ) : (
                        String(item[col.key] || '—').substring(0, 60)
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-ai btn-sm"
                        onClick={() => { setSelectedItem(item); handleAnalyze(item); }}
                        title="AI Analyze"
                      >
                        <FaRobot />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          fields={detailFields || formFields}
          onClose={() => { setSelectedItem(null); setAiAnalysis(null); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAnalyze={handleAnalyze}
          aiAnalysis={aiAnalysis}
          aiLoading={aiLoading}
        />
      )}

      {showNew && (
        <NewItemModal
          title={`New ${title.replace(/s$/, '')}`}
          fields={formFields}
          onSubmit={handleCreate}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}

export default FeaturePage;
