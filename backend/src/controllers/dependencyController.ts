import { Request, Response, NextFunction } from 'express';
import { DependencyService } from '../services/dependencyService';

export class DependencyController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const dependencies = await DependencyService.getAllDependencies();
      res.status(200).json({
        status: 'success',
        data: dependencies
      });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dependency = await DependencyService.createDependency(req.body);
      res.status(201).json({
        status: 'success',
        data: dependency
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await DependencyService.deleteDependency(id);
      res.status(200).json({
        status: 'success',
        message: 'Dependency mapping deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
