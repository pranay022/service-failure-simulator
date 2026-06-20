import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Service name is required',
    })
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must be at most 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Service name can only contain letters, numbers, hyphens, and underscores'),
    
    description: z.string().trim().max(500, 'Description must be at most 500 characters').optional().nullable(),
    owner: z.string().trim().max(100, 'Owner must be at most 100 characters').optional().nullable(),
    
    criticality: z.enum(['HIGH', 'MEDIUM', 'LOW'], {
      errorMap: () => ({ message: 'Criticality must be HIGH, MEDIUM, or LOW' }),
    }),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Service name must be at least 2 characters')
      .max(100, 'Service name must be at most 100 characters')
      .trim()
      .regex(/^[a-zA-Z0-9_-]+$/, 'Service name can only contain letters, numbers, hyphens, and underscores')
      .optional(),
    
    description: z.string().trim().max(500, 'Description must be at most 500 characters').optional().nullable(),
    owner: z.string().trim().max(100, 'Owner must be at most 100 characters').optional().nullable(),
    
    criticality: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  }),
});

export const serviceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid service ID format'),
  }),
});
