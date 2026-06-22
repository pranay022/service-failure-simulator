import { Service, Dependency, SimulationRun, SimulationResult } from './types';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper to handle fetch responses and throw HttpError on failure
async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'An error occurred while calling the API');
  }
  return json.data as T;
}

export const api = {
  // Service APIs
  async getServices(): Promise<Service[]> {
    const res = await fetch(`${API_BASE}/api/services`);
    return handleResponse<Service[]>(res);
  },

  async createService(data: {
    name: string;
    description?: string | null;
    owner?: string | null;
    criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  }): Promise<Service> {
    const res = await fetch(`${API_BASE}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Service>(res);
  },

  async updateService(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      owner?: string | null;
      criticality?: 'HIGH' | 'MEDIUM' | 'LOW';
    }
  ): Promise<Service> {
    const res = await fetch(`${API_BASE}/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Service>(res);
  },

  async deleteService(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/services/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to delete service');
    }
  },

  // Dependency APIs
  async getDependencies(): Promise<Dependency[]> {
    const res = await fetch(`${API_BASE}/api/dependencies`);
    return handleResponse<Dependency[]>(res);
  },

  async createDependency(data: {
    dependentId: string;
    dependencyId: string;
    type: 'HARD' | 'SOFT';
  }): Promise<Dependency> {
    const res = await fetch(`${API_BASE}/api/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Dependency>(res);
  },

  async deleteDependency(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/dependencies/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to delete dependency');
    }
  },

  // Simulation APIs
  async runSimulation(initialFailedServiceIds: string[]): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/api/simulations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialFailedServiceIds }),
    });
    return handleResponse<SimulationResult>(res);
  },

  async saveSimulation(name: string, initialFailedServiceIds: string[]): Promise<SimulationRun> {
    const res = await fetch(`${API_BASE}/api/simulations/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, initialFailedServiceIds }),
    });
    return handleResponse<SimulationRun>(res);
  },

  async getSimulationHistory(): Promise<SimulationRun[]> {
    const res = await fetch(`${API_BASE}/api/simulations/history`);
    return handleResponse<SimulationRun[]>(res);
  },

  async getSimulationRun(id: string): Promise<SimulationRun> {
    const res = await fetch(`${API_BASE}/api/simulations/history/${id}`);
    return handleResponse<SimulationRun>(res);
  },
};
