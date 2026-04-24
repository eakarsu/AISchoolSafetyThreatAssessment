import React, { useState } from 'react';
import { FaTimes, FaEdit, FaTrash, FaRobot, FaSave, FaBan } from 'react-icons/fa';
import AIResponseDisplay from './AIResponseDisplay';

function DetailModal({ item, fields, onClose, onEdit, onDelete, onAnalyze, aiAnalysis, aiLoading }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...item });

  if (!item) return null;

  const handleSave = () => {
    onEdit(editData);
    setEditing(false);
  };

  const handleChange = (key, value) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const getBadgeClass = (value) => {
    if (!value) return '';
    const v = String(value).toLowerCase().replace(/\s+/g, '-');
    return `badge badge-${v}`;
  };

  const isStatusField = (key) => {
    return ['status', 'severity', 'risk_level', 'riskLevel', 'threat_level', 'threatLevel', 'priority', 'level'].includes(key);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Edit Item' : 'Details'}</h3>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="modal-body">
          {editing ? (
            <div>
              {fields.map((field) => (
                <div className="form-group" key={field.key}>
                  <label>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="form-control"
                      value={editData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      className="form-control"
                      value={editData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      className="form-control"
                      value={editData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="detail-grid">
              {fields.map((field) => {
                const value = item[field.key];
                const displayValue = value === null || value === undefined ? '—' : String(value);
                const isLong = displayValue.length > 60;
                return (
                  <div className={`detail-field ${isLong ? 'full-width' : ''}`} key={field.key}>
                    <div className="field-label">{field.label}</div>
                    <div className="field-value">
                      {isStatusField(field.key) && value ? (
                        <span className={getBadgeClass(value)}>{displayValue}</span>
                      ) : displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(aiAnalysis || aiLoading) && !editing && (
            <AIResponseDisplay response={aiAnalysis} loading={aiLoading} />
          )}
        </div>

        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                <FaBan /> Cancel
              </button>
              <button className="btn btn-success" onClick={handleSave}>
                <FaSave /> Save
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ai btn-sm" onClick={() => onAnalyze && onAnalyze(item)}>
                <FaRobot /> AI Analyze
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                <FaEdit /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(item._id || item.id)}>
                <FaTrash /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
