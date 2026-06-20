import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/serviceService';

export class ServiceController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await ServiceService.getAllServices();
      res.status(200).json({
        status: 'success',
        data: services
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await ServiceService.getServiceById(id);
      res.status(200).json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ServiceService.createService(req.body);
      res.status(201).json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await ServiceService.updateService(id, req.body);
      res.status(200).json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ServiceService.deleteService(id);
      res.status(200).json({
        status: 'success',
        message: 'Service deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
