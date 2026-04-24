import React, { useState } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';

function NewItemModal({ title, fields, onSubmit, onClose }) {
  const [formData, setFormData] = useState(() => {
    const init = {};
    fields.forEach((f) => {
      if (f.type === 'boolean') init[f.key] = false;
      else if (f.defaultValue !== undefined) init[f.key] = f.defaultValue;
      else init[f.key] = '';
    });
    return init;
  });

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || 'Create New'}</h3>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((field) => (
              <div className="form-group" key={field.key}>
                <label>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="form-control"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="form-control"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Select {field.label}...</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', textTransform: 'none', letterSpacing: 'normal', fontWeight: 'normal', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={!!formData[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    {field.label}
                  </label>
                ) : (
                  <input
                    type={field.type || 'text'}
                    className="form-control"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><FaPlus /> Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewItemModal;
