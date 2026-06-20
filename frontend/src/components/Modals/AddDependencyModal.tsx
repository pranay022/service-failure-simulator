import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';
import { Service, Dependency } from '../../types';

interface AddDependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onSuccess: (newDependency: Dependency) => void;
}

export const AddDependencyModal: React.FC<AddDependencyModalProps> = ({
  isOpen,
  onClose,
  services,
  onSuccess,
}) => {
  const [dependentId, setDependentId] = useState('');
  const [dependencyId, setDependencyId] = useState('');
  const [type, setType] = useState<'HARD' | 'SOFT'>('HARD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!dependentId || !dependencyId) {
      setError('Please select both services');
      setLoading(false);
      return;
    }

    if (dependentId === dependencyId) {
      setError('A service cannot depend on itself');
      setLoading(false);
      return;
    }

    try {
      const created = await api.createDependency({
        dependentId,
        dependencyId,
        type,
      });
      onSuccess(created);
      // Reset form
      setDependentId('');
      setDependencyId('');
      setType('HARD');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create dependency');
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

        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Add Dependency Connection</h2>

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
          {/* Dependent Service */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Dependent Service (The caller - needs the dependency)
            </label>
            <select
              value={dependentId}
              onChange={(e) => setDependentId(e.target.value)}
              required
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
              <option value="">-- Select Dependent Service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.criticality})
                </option>
              ))}
            </select>
          </div>

          {/* Arrow Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0', fontSize: '18px', color: 'var(--text-muted)' }}>
            ⬇️ depends on ⬇️
          </div>

          {/* Dependency Service */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Dependency Service (The target - provides functionality)
            </label>
            <select
              value={dependencyId}
              onChange={(e) => setDependencyId(e.target.value)}
              required
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
              <option value="">-- Select Dependency Service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.criticality})
                </option>
              ))}
            </select>
          </div>

          {/* Connection Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Connection Type</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="depType"
                  value="HARD"
                  checked={type === 'HARD'}
                  onChange={() => setType('HARD')}
                  style={{ cursor: 'pointer' }}
                />
                <span>HARD (Outage cascades FAILED status)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="depType"
                  value="SOFT"
                  checked={type === 'SOFT'}
                  onChange={() => setType('SOFT')}
                  style={{ cursor: 'pointer' }}
                />
                <span>SOFT (Outage cascades DEGRADED status)</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
              {loading ? 'Creating Connection...' : 'Establish Dependency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
