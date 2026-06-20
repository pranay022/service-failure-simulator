export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'FAILED';

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  owner?: string | null;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  updatedAt: string;
  dependencies: {
    id: string;
    dependencyId: string;
    type: 'HARD' | 'SOFT';
  }[];
  dependents: {
    id: string;
    dependentId: string;
    type: 'HARD' | 'SOFT';
  }[];
}

export interface Dependency {
  id: string;
  dependentId: string;
  dependent: {
    id: string;
    name: string;
  };
  dependencyId: string;
  dependency: {
    id: string;
    name: string;
  };
  type: 'HARD' | 'SOFT';
  createdAt: string;
}

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

export interface SimulationRun {
  id: string;
  name: string;
  initialFailedServiceIds: string[];
  results: SimulationResult;
  createdAt: string;
}
