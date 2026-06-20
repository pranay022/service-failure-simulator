import { z } from 'zod';

export const createDependencySchema = z.object({
  body: z.object({
    dependentId: z.string({
      required_error: 'Dependent service ID is required',
    }).uuid('Invalid dependent service ID format'),
    
    dependencyId: z.string({
      required_error: 'Dependency service ID is required',
    }).uuid('Invalid dependency service ID format'),
    
    type: z.enum(['HARD', 'SOFT'], {
      errorMap: () => ({ message: 'Dependency type must be HARD or SOFT' }),
    }),
  }),
}).refine((data) => data.body.dependentId !== data.body.dependencyId, {
  message: 'A service cannot depend on itself',
  path: ['body', 'dependencyId'],
});

export const dependencyIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid dependency ID format'),
  }),
});
