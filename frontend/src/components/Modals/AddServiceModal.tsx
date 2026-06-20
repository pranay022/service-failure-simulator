import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';
import { Service } from '../../types';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newService: Service) => void;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [criticality, setCriticality] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Service name is required');
      setLoading(false);
      return;
    }

    try {
      const created = await api.createService({
        name: name.trim(),
        description: description.trim() || null,
        owner: owner.trim() || null,
        criticality,
      });
      onSuccess(created);
      // Reset form
      setName('');
      setDescription('');
      setOwner('');
      setCriticality('MEDIUM');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          color: 'var(--text-primary)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Add New Service</h2>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--color-failed)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Service Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Service Name</label>
            <input
              type="text"
              placeholder="e.g., payment-service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Criticality */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Criticality</label>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as any)}
              style={{
                background: 'rgba(16, 22, 34, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="HIGH">HIGH (Tier 1 - Mission Critical)</option>
              <option value="MEDIUM">MEDIUM (Tier 2 - Important)</option>
              <option value="LOW">LOW (Tier 3 - Non-Critical)</option>
            </select>
          </div>

          {/* Owner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Team Owner</label>
            <input
              type="text"
              placeholder="e.g., Billing Operations"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              placeholder="Provide a brief explanation of the service's purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--glass-border-hover)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
