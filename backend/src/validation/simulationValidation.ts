import { z } from 'zod';

export const runSimulationSchema = z.object({
  body: z.object({
    initialFailedServiceIds: z.array(z.string().uuid('Invalid service ID format'), {
      required_error: 'initialFailedServiceIds is required',
    }),
  }),
});

export const saveSimulationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Simulation name is required',
    })
    .min(3, 'Simulation name must be at least 3 characters')
    .max(100, 'Simulation name must be at most 100 characters')
    .trim(),
    
    initialFailedServiceIds: z.array(z.string().uuid('Invalid service ID format'), {
      required_error: 'initialFailedServiceIds is required',
    })
    .min(1, 'At least one initial failed service must be selected'),
  }),
});

export const simulationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid simulation ID format'),
  }),
});
