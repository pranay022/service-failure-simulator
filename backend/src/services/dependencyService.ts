import prisma from './db';
import { GraphService, GraphEdge } from './graphService';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';

export class DependencyService {
  public static async getAllDependencies() {
    return prisma.dependency.findMany({
      include: {
        dependent: { select: { id: true, name: true } },
        dependency: { select: { id: true, name: true } }
      }
    });
  }

  public static async createDependency(data: {
    dependentId: string;
    dependencyId: string;
    type: 'HARD' | 'SOFT';
  }) {
    if (data.dependentId === data.dependencyId) {
      throw new BadRequestError('A service cannot depend on itself');
    }

    // Verify services exist
    const [dependentExists, dependencyExists] = await Promise.all([
      prisma.service.findUnique({ where: { id: data.dependentId } }),
      prisma.service.findUnique({ where: { id: data.dependencyId } })
    ]);

    if (!dependentExists) {
      throw new NotFoundError(`Dependent service with ID ${data.dependentId} not found`);
    }
    if (!dependencyExists) {
      throw new NotFoundError(`Dependency service with ID ${data.dependencyId} not found`);
    }

    // Verify dependency doesn't already exist
    const existing = await prisma.dependency.findUnique({
      where: {
        dependentId_dependencyId: {
          dependentId: data.dependentId,
          dependencyId: data.dependencyId
        }
      }
    });

    if (existing) {
      throw new ConflictError('This dependency mapping already exists');
    }

    // Circular dependency detection
    // 1. Fetch all existing dependencies
    const allDependencies = await prisma.dependency.findMany();
    const graphEdges: GraphEdge[] = allDependencies.map(dep => ({
      id: dep.id,
      dependentId: dep.dependentId,
      dependencyId: dep.dependencyId,
      type: dep.type as 'HARD' | 'SOFT'
    }));

    // 2. Run cycle check
    const hasCycle = GraphService.wouldCreateCycle(
      data.dependentId,
      data.dependencyId,
      graphEdges
    );

    if (hasCycle) {
      throw new BadRequestError(`Circular dependency detected: Adding this dependency creates a loop between '${dependentExists.name}' and '${dependencyExists.name}'`);
    }

    return prisma.dependency.create({
      data: {
        dependentId: data.dependentId,
        dependencyId: data.dependencyId,
        type: data.type
      },
      include: {
        dependent: { select: { id: true, name: true } },
        dependency: { select: { id: true, name: true } }
      }
    });
  }

  public static async deleteDependency(id: string) {
    const dependency = await prisma.dependency.findUnique({
      where: { id }
    });

    if (!dependency) {
      throw new NotFoundError(`Dependency mapping with ID ${id} not found`);
    }

    return prisma.dependency.delete({
      where: { id }
    });
  }
}
