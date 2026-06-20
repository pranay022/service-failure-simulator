import React, { useState, useEffect } from 'react';
import { Trash2, Users, FileText, Activity, Link2, GitFork, ArrowRight, X, Edit, Save, AlertTriangle } from 'lucide-react';
import { Service, SimulationResultNode } from '../types';
import { api } from '../api';

interface InspectorProps {
  selectedService: Service | null;
  simulationNodeResult: SimulationResultNode | null;
  services: Service[];
  onClose: () => void;
  onServiceDeleted: (id: string) => void;
  onServiceUpdated: (service: Service) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedService,
  simulationNodeResult,
  services,
  onClose,
  onServiceDeleted,
  onServiceUpdated,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editCriticality, setEditCriticality] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [editDescription, setEditDescription] = useState('');

  // Custom Delete Confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state with selected service
  useEffect(() => {
    if (selectedService) {
      setEditName(selectedService.name);
      setEditOwner(selectedService.owner || '');
      setEditCriticality(selectedService.criticality);
      setEditDescription(selectedService.description || '');
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setError('');
    }
  }, [selectedService]);

  if (!selectedService) {
    return (
      <div
        className="glass-panel"
        style={{
          width: '320px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          borderLeft: '1px solid var(--glass-border)',
        }}
      >
        <Activity size={32} style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>No Service Selected</h3>
        <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>
          Click a node on the canvas to inspect its details, trace dependency failures, or manage it.
        </p>
      </div>
    );
  }

  // Criticality tags styling
  const criticalityStyles = {
    HIGH: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
    MEDIUM: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    LOW: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' }
  };
  const critStyle = criticalityStyles[selectedService.criticality] || criticalityStyles.LOW;

  // Active status in simulation
  const status = simulationNodeResult?.status || 'HEALTHY';
  const isImpacted = status !== 'HEALTHY';
  const impactPath = simulationNodeResult?.impactPath || null;

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setError('');

    try {
      await api.deleteService(selectedService.id);
      setDeleting(false);
      setShowDeleteConfirm(false);
      onServiceDeleted(selectedService.id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete service');
      setDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError('Service name is required');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const updated = await api.updateService(selectedService.id, {
        name: editName.trim(),
        owner: editOwner.trim() || null,
        criticality: editCriticality,
        description: editDescription.trim() || null,
      });
      onServiceUpdated(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update service');
    } finally {
      setUpdating(false);
    }
  };

  // Find detailed info of dependencies
  const dependenciesList = selectedService.dependencies.map((d) => {
    const depService = services.find((s) => s.id === d.dependencyId);
    return {
      id: d.id,
      name: depService ? depService.name : 'Unknown Service',
      criticality: depService ? depService.criticality : 'LOW',
      type: d.type,
    };
  });

  // Find detailed info of dependents
  const dependentsList = selectedService.dependents.map((d) => {
    const depService = services.find((s) => s.id === d.dependentId);
    return {
      id: d.id,
      name: depService ? depService.name : 'Unknown Service',
      criticality: depService ? depService.criticality : 'LOW',
      type: d.type,
    };
  });

  return (
    <div
      className="glass-panel"
      style={{
        width: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--glass-border)',
        boxShadow: '-8px 0 32px 0 rgba(0, 0, 0, 0.2)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Inspector</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--color-failed)',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}

        {/* Identity / Editing Section */}
        {isEditing ? (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Service Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Criticality</label>
              <select
                value={editCriticality}
                onChange={(e) => setEditCriticality(e.target.value as any)}
                style={{
                  background: 'rgba(16, 22, 34, 0.95)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Team Owner</label>
              <input
                type="text"
                value={editOwner}
                onChange={(e) => setEditOwner(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--glass-border-hover)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Save size={12} />
                <span>{updating ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, wordBreak: 'break-all' }}>{selectedService.name}</h3>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: critStyle.bg,
                    color: critStyle.text,
                  }}
                >
                  {selectedService.criticality}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                title="Edit Service Details"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  padding: '5px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Edit size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Users size={12} />
              <span>Owner: {selectedService.owner || 'N/A'}</span>
            </div>

            {selectedService.description && (
              <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <FileText size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ lineHeight: '1.4' }}>{selectedService.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Current State / Cascade Trace */}
        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: isImpacted 
              ? (status === 'FAILED' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)')
              : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${
              isImpacted
                ? (status === 'FAILED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)')
                : 'rgba(16, 185, 129, 0.2)'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isImpacted
                  ? (status === 'FAILED' ? 'var(--color-failed)' : 'var(--color-degraded)')
                  : 'var(--color-healthy)',
                boxShadow: isImpacted
                  ? (status === 'FAILED' ? 'var(--glow-failed)' : 'var(--glow-degraded)')
                  : 'var(--glow-healthy)',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Simulated Status: {status}
            </span>
          </div>

          {isImpacted && impactPath && impactPath.length > 1 && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Failure Cascade Path:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                {impactPath.map((nodeName, idx) => (
                  <React.Fragment key={idx}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: idx === 0 
                          ? 'rgba(239, 68, 68, 0.2)' 
                          : (idx === impactPath.length - 1 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'),
                        color: idx === 0 ? 'var(--color-failed)' : 'var(--text-primary)',
                        border: idx === 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)',
                        fontWeight: idx === 0 || idx === impactPath.length - 1 ? 600 : 400,
                      }}
                    >
                      {nodeName}
                    </span>
                    {idx < impactPath.length - 1 && <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />}
                  </React.Fragment>
                ))}
              </div>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                Root Outage in red
              </span>
            </div>
          )}
        </div>

        {/* Dependencies Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Link2 size={14} style={{ color: 'var(--text-secondary)' }} />
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Dependencies ({dependenciesList.length})
            </h4>
          </div>

          {dependenciesList.length === 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>This service has no dependencies.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dependenciesList.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{d.name}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '1px 4px',
                      borderRadius: '3px',
                      backgroundColor: d.type === 'HARD' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: d.type === 'HARD' ? 'var(--color-failed)' : 'var(--color-degraded)',
                      border: d.type === 'HARD' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)',
                    }}
                  >
                    {d.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dependents Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <GitFork size={14} style={{ color: 'var(--text-secondary)' }} />
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Dependents ({dependentsList.length})
            </h4>
          </div>

          {dependentsList.length === 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No other services depend on this.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dependentsList.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{d.name}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      padding: '1px 4px',
                      borderRadius: '3px',
                      backgroundColor: d.type === 'HARD' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: d.type === 'HARD' ? 'var(--color-failed)' : 'var(--color-degraded)',
                      border: d.type === 'HARD' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)',
                    }}
                  >
                    {d.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          {showDeleteConfirm ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={14} color="var(--color-failed)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  Are you sure you want to delete <strong>{selectedService.name}</strong>? This will remove all its dependency links.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'var(--color-failed)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting || isEditing}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--color-failed)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: (deleting || isEditing) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                borderWidth: '1px',
                borderStyle: 'solid',
                opacity: isEditing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isEditing) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
              }}
              onMouseLeave={(e) => {
                if (!isEditing) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              }}
            >
              <Trash2 size={14} />
              <span>Delete Service</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
