import { Request, Response, NextFunction } from 'express';
import { SimulationService } from '../services/simulationService';

export class SimulationController {
  public static async run(req: Request, res: Response, next: NextFunction) {
    try {
      const { initialFailedServiceIds } = req.body;
      const results = await SimulationService.runSimulation(initialFailedServiceIds);
      res.status(200).json({
        status: 'success',
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  public static async save(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, initialFailedServiceIds } = req.body;
      const run = await SimulationService.saveSimulation(name, initialFailedServiceIds);
      res.status(201).json({
        status: 'success',
        data: run
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await SimulationService.getSimulationHistory();
      res.status(200).json({
        status: 'success',
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const run = await SimulationService.getSimulationRunById(id);
      res.status(200).json({
        status: 'success',
        data: run
      });
    } catch (error) {
      next(error);
    }
  }
}
