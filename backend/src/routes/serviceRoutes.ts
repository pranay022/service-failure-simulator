import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { validate } from '../middleware/validate';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema
} from '../validation/serviceValidation';

const router = Router();

router.get('/', ServiceController.getAll);

router.get('/:id', validate(serviceIdSchema), ServiceController.getById);

router.post('/', validate(createServiceSchema), ServiceController.create);

router.put('/:id', validate(updateServiceSchema), ServiceController.update);

router.delete('/:id', validate(serviceIdSchema), ServiceController.delete);

export default router;
