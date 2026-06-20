import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Trash2, 
  Save, 
  RotateCcw, 
  History, 
  Info
} from 'lucide-react';
import { Service, SimulationRun, SimulationResult } from '../types';

interface SidebarProps {
  services: Service[];
  simulationResult: SimulationResult | null;
  initialFailedServiceIds: string[];
  simulationHistory: SimulationRun[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  criticalityFilter: string;
  setCriticalityFilter: (filter: string) => void;
  onToggleFailure: (id: string) => void;
  onClearSimulation: () => void;
  onSaveSimulation: (name: string) => Promise<void>;
  onLoadSimulationRun: (run: SimulationRun) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  services,
  simulationResult,
  initialFailedServiceIds,
  simulationHistory,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  criticalityFilter,
  setCriticalityFilter,
  onToggleFailure,
  onClearSimulation,
  onSaveSimulation,
  onLoadSimulationRun,
}) => {
  const [scenarioName, setScenarioName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Calculate quick dashboard stats
  const totalCount = services.length;
  let healthyCount = totalCount;
  let degradedCount = 0;
  let failedCount = 0;
  let blastRadius = 0;
  let severityScore = 0;

  if (simulationResult) {
    healthyCount = 0;
    for (const key in simulationResult.nodes) {
      const node = simulationResult.nodes[key];
      if (node.status === 'HEALTHY') healthyCount++;
      else if (node.status === 'DEGRADED') degradedCount++;
      else if (node.status === 'FAILED') failedCount++;
    }
    blastRadius = simulationResult.blastRadiusPercent;
    severityScore = simulationResult.impactSeverityScore;
  }

  // Find names of currently failed trigger services
  const triggerServices = initialFailedServiceIds.map(id => {
    const s = services.find(x => x.id === id);
    return { id, name: s ? s.name : 'Unknown' };
  });

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!scenarioName.trim()) {
      setSaveError('Scenario name is required');
      return;
    }
    if (initialFailedServiceIds.length === 0) {
      setSaveError('No failed services selected to simulate');
      return;
    }

    setSaving(true);
    try {
      await onSaveSimulation(scenarioName.trim());
      setScenarioName('');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save simulation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        width: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--glass-border)',
        boxShadow: '8px 0 32px 0 rgba(0, 0, 0, 0.2)',
        overflowY: 'auto',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '20px',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <Shield size={22} color="var(--color-healthy)" style={{ filter: 'drop-shadow(var(--glow-healthy))' }} />
        <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.03em' }}>Blast Radius Simulator</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '22px', flex: 1 }}>
        
        {/* Statistics Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Metrics
          </h2>
          
          {/* Blast Radius Circular Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Blast Radius</span>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: blastRadius > 50 ? 'var(--color-failed)' : (blastRadius > 0 ? 'var(--color-degraded)' : 'var(--color-healthy)') }}>
                {blastRadius}%
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Severity Score</span>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: severityScore > 5 ? 'var(--color-failed)' : (severityScore > 0 ? 'var(--color-degraded)' : 'var(--text-primary)') }}>
                {severityScore}
              </h3>
            </div>
          </div>

          {/* Quick status bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '6px', borderRadius: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{totalCount}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Total</span>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-healthy)' }}>{healthyCount}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Healthy</span>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.1)', padding: '6px', borderRadius: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-degraded)' }}>{degradedCount}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Degraded</span>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-failed)' }}>{failedCount}</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Failed</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter Services
          </h2>

          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '8px 10px 8px 32px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'rgba(16, 22, 34, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All Statuses</option>
              <option value="HEALTHY">HEALTHY</option>
              <option value="DEGRADED">DEGRADED</option>
              <option value="FAILED">FAILED</option>
            </select>

            {/* Criticality Filter */}
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              style={{
                background: 'rgba(16, 22, 34, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All Tiers</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        {/* Failure Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Simulation Control
          </h2>

          {/* Trigger Outages Selector */}
          <div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onToggleFailure(e.target.value);
                  e.target.value = ''; // Reset selector
                }
              }}
              style={{
                width: '100%',
                background: 'rgba(16, 22, 34, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Select service to fail...</option>
              {services
                .filter(s => !initialFailedServiceIds.includes(s.id))
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Failed services list */}
          {triggerServices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active Root Causes ({triggerServices.length}):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {triggerServices.map(ts => (
                  <div
                    key={ts.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ color: 'var(--color-failed)', fontWeight: 500 }}>{ts.name}</span>
                    <button
                      onClick={() => onToggleFailure(ts.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-failed)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {initialFailedServiceIds.length > 0 && (
            <button
              onClick={onClearSimulation}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              <RotateCcw size={12} />
              <span>Clear Simulation</span>
            </button>
          )}

          {/* Save Scenario Form */}
          {initialFailedServiceIds.length > 0 && (
            <form onSubmit={handleSaveScenario} style={{ marginTop: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Save Outage Scenario
              </span>
              {saveError && <span style={{ fontSize: '10px', color: 'var(--color-failed)', display: 'block', marginBottom: '6px' }}>{saveError}</span>}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Scenario name..."
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid var(--glass-border-hover)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Save size={12} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Simulation History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <History size={13} />
            <h2 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historical Simulations ({simulationHistory.length})
            </h2>
          </div>

          {simulationHistory.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0' }}>
              <Info size={11} />
              <span>No historical simulations saved yet.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, maxHeight: '200px' }}>
              {simulationHistory.map(run => (
                <div
                  key={run.id}
                  onClick={() => onLoadSimulationRun(run)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '75%' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {run.name}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 4px',
                        borderRadius: '3px',
                        backgroundColor: run.results?.blastRadiusPercent > 50 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: run.results?.blastRadiusPercent > 50 ? 'var(--color-failed)' : 'var(--color-healthy)',
                      }}
                    >
                      {run.results?.blastRadiusPercent || 0}% BR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
