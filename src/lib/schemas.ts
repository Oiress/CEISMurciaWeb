import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Introduce un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El correo electrónico es obligatorio')
      .email('Introduce un correo electrónico válido'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// ── Phase 2: Annotation schemas ────────────────────────────────────────────────

export const createAnnotationSchema = z.object({
  tema_id: z.number().int().positive(),
  paragraph_id: z.string().min(1).max(64),
  type: z.enum(['note', 'highlight']),
  content: z.string().max(5000).optional(),
  color: z.enum(['yellow', 'green', 'pink', 'blue']).optional(),
  range_start: z.number().int().nonnegative().optional(),
  range_end: z.number().int().nonnegative().optional(),
}).refine(
  (d) => d.type !== 'highlight' || (d.color !== undefined && d.range_start !== undefined && d.range_end !== undefined && d.range_end > d.range_start),
  { message: 'highlight requires color, range_start, and range_end (end > start)' }
).refine(
  (d) => d.type !== 'note' || (d.content !== undefined && d.content.length > 0),
  { message: 'note requires content' }
)

export const updateAnnotationSchema = z.object({
  content: z.string().max(5000).optional(),
  color: z.enum(['yellow', 'green', 'pink', 'blue']).optional(),
})

export const upsertSummarySchema = z.object({
  content: z.string().max(10000),
})

export const upsertDrawingSchema = z.object({
  strokes: z.array(z.object({
    tool: z.enum(['pen', 'marker', 'eraser']),
    color: z.string().max(20),
    width: z.number().positive(),
    points: z.array(z.object({ x: z.number(), y: z.number() })),
  })),
})

export const upsertProgressSchema = z.object({
  scroll_percent: z.number().min(0).max(100),
  last_paragraph_id: z.string().max(64).nullable(),
})
