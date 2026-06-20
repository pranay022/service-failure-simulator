import { Router } from 'express';
import { SimulationController } from '../controllers/simulationController';
import { validate } from '../middleware/validate';
import {
  runSimulationSchema,
  saveSimulationSchema,
  simulationIdSchema
} from '../validation/simulationValidation';

const router = Router();

router.post('/run', validate(runSimulationSchema), SimulationController.run);

router.post('/save', validate(saveSimulationSchema), SimulationController.save);

router.get('/history', SimulationController.getHistory);

router.get('/history/:id', validate(simulationIdSchema), SimulationController.getById);

export default router;
