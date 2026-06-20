import { Router } from 'express';
import { DependencyController } from '../controllers/dependencyController';
import { validate } from '../middleware/validate';
import {
  createDependencySchema,
  dependencyIdSchema
} from '../validation/dependencyValidation';

const router = Router();

router.get('/', DependencyController.getAll);

router.post('/', validate(createDependencySchema), DependencyController.create);

router.delete('/:id', validate(dependencyIdSchema), DependencyController.delete);

export default router;
