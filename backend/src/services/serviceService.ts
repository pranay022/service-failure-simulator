import prisma from './db';
import { ConflictError, NotFoundError } from '../utils/errors';

export class ServiceService {
  public static async getAllServices() {
    return prisma.service.findMany({
      orderBy: { name: 'asc' },
      include: {
        dependencies: {
          select: {
            id: true,
            dependencyId: true,
            type: true
          }
        },
        dependents: {
          select: {
            id: true,
            dependentId: true,
            type: true
          }
        }
      }
    });
  }

  public static async getServiceById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        dependencies: true,
        dependents: true
      }
    });

    if (!service) {
      throw new NotFoundError(`Service with ID ${id} not found`);
    }

    return service;
  }

  public static async createService(data: {
    name: string;
    description?: string | null;
    owner?: string | null;
    criticality: string;
  }) {
    const existing = await prisma.service.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      throw new ConflictError(`Service with name '${data.name}' already exists`);
    }

    return prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        owner: data.owner,
        criticality: data.criticality
      }
    });
  }

  public static async updateService(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      owner?: string | null;
      criticality?: string;
    }
  ) {
    // Check if service exists
    await this.getServiceById(id);

    if (data.name) {
      const existingWithName = await prisma.service.findFirst({
        where: {
          name: data.name,
          id: { not: id }
        }
      });
      if (existingWithName) {
        throw new ConflictError(`Service with name '${data.name}' already exists`);
      }
    }

    return prisma.service.update({
      where: { id },
      data
    });
  }

  public static async deleteService(id: string) {
    // Check if service exists
    await this.getServiceById(id);

    return prisma.service.delete({
      where: { id }
    });
  }
}
