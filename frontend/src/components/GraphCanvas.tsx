import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ServiceNode } from './NodeTypes/ServiceNode';
import { DependencyEdge } from './NodeTypes/DependencyEdge';
import { Service, Dependency, SimulationResult } from '../types';

// Register custom node type
const nodeTypes = {
  serviceNode: ServiceNode,
};

// Register custom edge type (handles curved bending for vertically-aligned nodes)
const edgeTypes = {
  dependencyEdge: DependencyEdge,
};

interface GraphCanvasProps {
  services: Service[];
  dependencies: Dependency[];
  simulationResult: SimulationResult | null;
  initialFailedServiceIds: string[];
  selectedServiceId: string | null;
  onSelectService: (id: string | null) => void;
  onToggleFailure: (id: string) => void;
  onConnectEdges: (sourceId: string, targetId: string) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  services,
  dependencies,
  simulationResult,
  initialFailedServiceIds,
  selectedServiceId,
  onSelectService,
  onToggleFailure,
  onConnectEdges,
}) => {
  // 1. Calculate topological/layered layout for nodes
  const layoutNodes = useMemo(() => {
    if (services.length === 0) return [];

    const nodesMap = new Map<string, Service>();
    for (const s of services) {
      nodesMap.set(s.id, s);
    }

    // Build incoming dependents map (who is dependent on whom)
    // and outgoing dependencies list
    const dependentsMap = new Map<string, string[]>(); // dependencyId -> list of dependentIds
    const dependenciesMap = new Map<string, string[]>(); // dependentId -> list of dependencyIds

    for (const dep of dependencies) {
      if (!dependentsMap.has(dep.dependencyId)) {
        dependentsMap.set(dep.dependencyId, []);
      }
      dependentsMap.get(dep.dependencyId)!.push(dep.dependentId);

      if (!dependenciesMap.has(dep.dependentId)) {
        dependenciesMap.set(dep.dependentId, []);
      }
      dependenciesMap.get(dep.dependentId)!.push(dep.dependencyId);
    }

    // Calculate node depth standardly
    // Root nodes (entry points) are those which no other service depends on. Depth = 0.
    const depths: { [id: string]: number } = {};

    const calculateDepth = (id: string, path = new Set<string>()): number => {
      if (depths[id] !== undefined) return depths[id];
      if (path.has(id)) return 0; // Handle cycles safely

      path.add(id);
      const outgoingDeps = dependenciesMap.get(id) || [];
      if (outgoingDeps.length === 0) {
        depths[id] = 0;
        return 0;
      }

      let maxDepth = 0;
      for (const depId of outgoingDeps) {
        maxDepth = Math.max(maxDepth, calculateDepth(depId, new Set(path)) + 1);
      }

      depths[id] = maxDepth;
      return maxDepth;
    };

    // Calculate depths for all services
    for (const s of services) {
      calculateDepth(s.id);
    }

    // Group nodes by depth
    const depthGroups: { [depth: number]: string[] } = {};
    for (const s of services) {
      const depth = depths[s.id] || 0;
      if (!depthGroups[depth]) {
        depthGroups[depth] = [];
      }
      depthGroups[depth].push(s.id);
    }

    // Assign positions
    const finalNodes: Node[] = [];
    const xGap = 260;
    const yGap = 150;

    const depthKeys = Object.keys(depthGroups)
      .map(Number)
      .sort((a, b) => a - b); // Row 0 is at top, increasing depth moves down

    depthKeys.forEach((depth) => {
      const serviceIds = depthGroups[depth];
      const rowWidth = (serviceIds.length - 1) * xGap;
      const xStart = -rowWidth / 2; // Center row horizontally

      serviceIds.forEach((id, index) => {
        const service = nodesMap.get(id);
        if (!service) return;

        // Get status and error propagation context
        const nodeSimData = simulationResult?.nodes[id];
        const status = nodeSimData?.status || 'HEALTHY';
        const isInitialFailure = initialFailedServiceIds.includes(id);

        finalNodes.push({
          id: service.id,
          type: 'serviceNode',
          position: {
            x: xStart + index * xGap,
            y: 50 + depth * yGap,
          },
          data: {
            id: service.id,
            name: service.name,
            criticality: service.criticality,
            owner: service.owner,
            status,
            isInitialFailure,
            onToggleFailure,
          },
          selected: selectedServiceId === service.id,
        });
      });
    });

    return finalNodes;
  }, [services, dependencies, simulationResult, initialFailedServiceIds, selectedServiceId, onToggleFailure]);

  // 2. Map dependencies into React Flow Edges
  const layoutEdges = useMemo(() => {
    return dependencies.map((dep): Edge => {
      // Determine simulated edge status
      // If dependent fails because of dependency, the edge carries that status
      let edgeClass = 'edge-healthy';
      const targetSim = simulationResult?.nodes[dep.dependencyId]; // The dependency

      if (targetSim && targetSim.status !== 'HEALTHY') {
        // If dependency is degraded/failed, cascade that status
        if (targetSim.status === 'FAILED' && dep.type === 'HARD') {
          edgeClass = 'edge-failed';
        } else {
          edgeClass = 'edge-degraded';
        }
      }

      return {
        id: dep.id,
        // Source is the dependent (where edge starts)
        // Target is the dependency (where edge points)
        source: dep.dependentId,
        target: dep.dependencyId,
        type: 'dependencyEdge',
        className: edgeClass,
        animated: edgeClass !== 'edge-healthy',
        style: {
          strokeDasharray: dep.type === 'SOFT' ? '5,5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeClass === 'edge-failed' 
            ? 'var(--color-failed)' 
            : (edgeClass === 'edge-degraded' ? 'var(--color-degraded)' : 'rgba(255, 255, 255, 0.2)'),
        },
      };
    });
  }, [dependencies, simulationResult]);

  // 3. Handle React Flow interactions
  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    onSelectService(node.id);
  };

  const onPaneClick = () => {
    onSelectService(null);
  };

  const onConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      onConnectEdges(connection.source, connection.target);
    }
  };

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={layoutNodes}
        edges={layoutEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Floating Canvas Tips */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '2px', backgroundColor: 'var(--text-muted)' }} />
          <span>Solid Line = HARD dependency</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '2px', borderBottom: '2px dashed var(--text-muted)' }} />
          <span>Dashed Line = SOFT dependency</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <span>💡 Tip: Drag connections between handles to link services.</span>
        </div>
      </div>
    </div>
  );
};
