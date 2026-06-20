import prisma from './db';
import { GraphService, GraphNode, GraphEdge, SimulationResult } from './graphService';
import { NotFoundError } from '../utils/errors';

export class SimulationService {

  public static async runSimulation(initialFailedServiceIds: string[]): Promise<SimulationResult> {
    // Fetch all services and dependencies
    const [services, dependencies] = await Promise.all([
      prisma.service.findMany(),
      prisma.dependency.findMany()
    ]);

    const graphNodes: GraphNode[] = services.map(s => ({
      id: s.id,
      name: s.name,
      criticality: s.criticality as 'HIGH' | 'MEDIUM' | 'LOW'
    }));

    const graphEdges: GraphEdge[] = dependencies.map(d => ({
      id: d.id,
      dependentId: d.dependentId,
      dependencyId: d.dependencyId,
      type: d.type as 'HARD' | 'SOFT'
    }));

    return GraphService.simulateFailures(graphNodes, graphEdges, initialFailedServiceIds);
  }


  public static async saveSimulation(name: string, initialFailedServiceIds: string[]) {
    // First run the simulation to get findings
    const results = await this.runSimulation(initialFailedServiceIds);

    // Save simulation run history
    return prisma.simulationRun.create({
      data: {
        name,
        initialFailedServiceIds: initialFailedServiceIds,
        // Prisma allows passing plain JSON objects to Json fields
        results: results as any
      }
    });
  }


  public static async getSimulationHistory() {
    return prisma.simulationRun.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }


  public static async getSimulationRunById(id: string) {
    const run = await prisma.simulationRun.findUnique({
      where: { id }
    });

    if (!run) {
      throw new NotFoundError(`Simulation run with ID ${id} not found`);
    }

    return run;
  }
}
