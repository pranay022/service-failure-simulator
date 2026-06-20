import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle, AlertTriangle, XCircle, Skull, RefreshCw } from 'lucide-react';
import { ServiceStatus } from '../../types';

interface ServiceNodeData {
  id: string;
  name: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  owner?: string | null;
  status: ServiceStatus;
  isInitialFailure: boolean;
  onToggleFailure: (id: string) => void;
}

export const ServiceNode: React.FC<NodeProps<ServiceNodeData>> = ({ data, selected }) => {
  const { name, criticality, owner, status, isInitialFailure, onToggleFailure } = data;

  // Determine styles and icons based on status
  let statusIcon = <CheckCircle size={14} color="var(--color-healthy)" />;
  let statusText = 'Healthy';
  let nodeClass = 'node-healthy';

  if (status === 'DEGRADED') {
    statusIcon = <AlertTriangle size={14} color="var(--color-degraded)" />;
    statusText = 'Degraded';
    nodeClass = 'node-degraded';
  } else if (status === 'FAILED') {
    statusIcon = isInitialFailure ? 
      <Skull size={14} color="var(--color-failed)" /> : 
      <XCircle size={14} color="var(--color-failed)" />;
    statusText = isInitialFailure ? 'Root Outage' : 'Failed';
    nodeClass = 'node-failed';
  }

  // Criticality badge colors
  const criticalityStyles = {
    HIGH: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
    MEDIUM: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    LOW: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' }
  };

  const critStyle = criticalityStyles[criticality] || criticalityStyles.LOW;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the node when clicking the button
    onToggleFailure(data.id);
  };

  return (
    <div className={`custom-node ${nodeClass} ${selected ? 'node-selected' : ''}`} style={{ transition: 'all 0.3s ease' }}>
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="custom-handle"
        style={{ borderRadius: '2px' }}
      />

      {/* Header with Criticality Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span 
          style={{ 
            fontSize: '9px', 
            fontWeight: 600, 
            padding: '2px 6px', 
            borderRadius: '4px',
            background: critStyle.bg,
            color: critStyle.text,
            letterSpacing: '0.05em'
          }}
        >
          {criticality}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          {statusIcon}
          <span style={{ fontWeight: 500, fontSize: '10px' }}>{statusText}</span>
        </div>
      </div>

      {/* Service Name */}
      <h3 
        style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          marginBottom: '2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {name}
      </h3>

      {/* Owner */}
      <p 
        style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)',
          marginBottom: '12px'
        }}
      >
        {owner || 'No Owner'}
      </p>

      {/* Action Button */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: '6px',
          border: 'none',
          fontSize: '10px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          background: status === 'FAILED' && isInitialFailure
            ? 'rgba(16, 185, 129, 0.2)' 
            : 'rgba(239, 68, 68, 0.15)',
          color: status === 'FAILED' && isInitialFailure
            ? 'var(--color-healthy)' 
            : 'var(--color-failed)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: status === 'FAILED' && isInitialFailure
            ? 'rgba(16, 185, 129, 0.4)' 
            : 'rgba(239, 68, 68, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'none';
        }}
      >
        {status === 'FAILED' && isInitialFailure ? (
          <>
            <RefreshCw size={11} />
            <span>Restore Service</span>
          </>
        ) : (
          <>
            <Skull size={11} />
            <span>Trigger Outage</span>
          </>
        )}
      </button>

      <Handle
        type="source"
        position={Position.Bottom}
        className="custom-handle"
        style={{ borderRadius: '2px' }}
      />
    </div>
  );
};
