export interface GraphNode {
  id: string;
  name: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface GraphEdge {
  id: string;
  dependentId: string;
  dependencyId: string;
  type: 'HARD' | 'SOFT';
}

export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'FAILED';

export interface SimulationResultNode {
  id: string;
  name: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  status: ServiceStatus;
  impactPath: string[] | null;
}

export interface SimulationResult {
  blastRadiusPercent: number;
  impactSeverityScore: number;
  totalServices: number;
  impactedServicesCount: number;
  nodes: { [serviceId: string]: SimulationResultNode };
  initialFailedServiceIds: string[];
}

export class GraphService {

  public static wouldCreateCycle(
    dependentId: string,
    dependencyId: string,
    edges: GraphEdge[]
  ): boolean {
    if (dependentId === dependencyId) {
      return true;
    }

    // Build adjacency list: node -> list of nodes it depends on
    const adjList = new Map<string, string[]>();
    for (const edge of edges) {
      if (!adjList.has(edge.dependentId)) {
        adjList.set(edge.dependentId, []);
      }
      adjList.get(edge.dependentId)!.push(edge.dependencyId);
    }

    // DFS to check if dependencyId can reach dependentId
    const visited = new Set<string>();
    const queue: string[] = [dependencyId];
    visited.add(dependencyId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === dependentId) {
        return true;
      }

      const neighbors = adjList.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  public static simulateFailures(
    nodes: GraphNode[],
    edges: GraphEdge[],
    initialFailedIds: string[]
  ): SimulationResult {
    const totalServices = nodes.length;
    if (totalServices === 0) {
      return {
        blastRadiusPercent: 0,
        impactSeverityScore: 0,
        totalServices: 0,
        impactedServicesCount: 0,
        nodes: {},
        initialFailedServiceIds: []
      };
    }

    const nodeMap = new Map<string, GraphNode>();
    for (const n of nodes) {
      nodeMap.set(n.id, n);
    }

    // Initialize state of all services
    const resultNodes: { [id: string]: SimulationResultNode } = {};
    for (const n of nodes) {
      resultNodes[n.id] = {
        id: n.id,
        name: n.name,
        criticality: n.criticality,
        status: 'HEALTHY',
        impactPath: null
      };
    }

    // Set initial failures
    const queue: string[] = [];
    const validInitialFailedIds: string[] = [];

    for (const id of initialFailedIds) {
      if (resultNodes[id]) {
        resultNodes[id].status = 'FAILED';
        resultNodes[id].impactPath = [resultNodes[id].name];
        queue.push(id);
        validInitialFailedIds.push(id);
      }
    }

    const dependentsMap = new Map<string, GraphEdge[]>();
    for (const edge of edges) {
      if (!dependentsMap.has(edge.dependencyId)) {
        dependentsMap.set(edge.dependencyId, []);
      }
      dependentsMap.get(edge.dependencyId)!.push(edge);
    }

    // Build lookup for each service's active dependencies to easily re-evaluate
    const dependenciesMap = new Map<string, GraphEdge[]>();
    for (const edge of edges) {
      if (!dependenciesMap.has(edge.dependentId)) {
        dependenciesMap.set(edge.dependentId, []);
      }
      dependenciesMap.get(edge.dependentId)!.push(edge);
    }

    // A queue item is a service ID whose state has worsened.
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentResult = resultNodes[currentId];

      // Find all services that depend on this service
      const dependentEdges = dependentsMap.get(currentId) || [];
      for (const edge of dependentEdges) {
        const depServiceId = edge.dependentId;
        const depResult = resultNodes[depServiceId];

        // Re-evaluate the dependent service state based on all its dependencies
        const serviceDependencies = dependenciesMap.get(depServiceId) || [];
        
        let newStatus: ServiceStatus = 'HEALTHY';
        let triggeringDependencyName: string | null = null;
        let triggeringDependencyId: string | null = null;

        for (const depEdge of serviceDependencies) {
          const statusOfDependency = resultNodes[depEdge.dependencyId]?.status || 'HEALTHY';
          const dependencyNode = nodeMap.get(depEdge.dependencyId);
          const dependencyName = dependencyNode ? dependencyNode.name : 'Unknown';

          if (statusOfDependency === 'FAILED') {
            if (depEdge.type === 'HARD') {
              // HARD dependency failure triggers FAILED status
              newStatus = 'FAILED';
              triggeringDependencyName = dependencyName;
              triggeringDependencyId = depEdge.dependencyId;
              break; // FAILED is the worst status, we can stop checking others
            } else {
              // SOFT dependency failure triggers DEGRADED status
              newStatus = 'DEGRADED';
              triggeringDependencyName = dependencyName;
              triggeringDependencyId = depEdge.dependencyId;
            }
          } else if (statusOfDependency === 'DEGRADED') {
            // Any degraded dependency triggers DEGRADED status
            newStatus = 'DEGRADED';
            triggeringDependencyName = dependencyName;
            triggeringDependencyId = depEdge.dependencyId;
          }
        }

        // If status worsened, update and queue
        const statusHierarchy = { HEALTHY: 0, DEGRADED: 1, FAILED: 2 };
        if (statusHierarchy[newStatus] > statusHierarchy[depResult.status]) {
          depResult.status = newStatus;
          
          // Build impact path
          if (triggeringDependencyId && resultNodes[triggeringDependencyId]) {
            const parentPath = resultNodes[triggeringDependencyId].impactPath || [];
            depResult.impactPath = [...parentPath, depResult.name];
          } else {
            depResult.impactPath = [depResult.name];
          }

          queue.push(depServiceId);
        }
      }
    }

    // Calculate metrics
    let impactedCount = 0;
    let totalSeverityScore = 0;

    const criticalityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const statusWeights = { HEALTHY: 0.0, DEGRADED: 0.5, FAILED: 1.0 };

    for (const key in resultNodes) {
      const node = resultNodes[key];
      if (node.status !== 'HEALTHY') {
        impactedCount++;
      }
      
      const cWeight = criticalityWeights[node.criticality] || 1;
      const sWeight = statusWeights[node.status] || 0;
      totalSeverityScore += cWeight * sWeight;
    }

    const blastRadiusPercent = Math.round((impactedCount / totalServices) * 100);

    return {
      blastRadiusPercent,
      impactSeverityScore: parseFloat(totalSeverityScore.toFixed(1)),
      totalServices,
      impactedServicesCount: impactedCount,
      nodes: resultNodes,
      initialFailedServiceIds: validInitialFailedIds
    };
  }
}
