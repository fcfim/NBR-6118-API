/**
 * Shear Design Validation Schema
 */

import { z } from "zod";
import { SectionInputSchema } from "./section.schema";
import {
  ConcreteInputSchema,
  PassiveSteelInputSchema,
} from "./material.schema";

/**
 * Shear force input schema
 */
export const ShearForceSchema = z.union([
  z.number().transform((val) => ({ value: val, unit: "kN" as const })),
  z.object({
    value: z.number(),
    unit: z.enum(["kN", "tf", "kgf"]),
  }),
]);

export type ShearForceInput = z.infer<typeof ShearForceSchema>;

/**
 * Shear design schema
 */
export const ShearDesignSchema = z.object({
  /** Section geometry */
  section: SectionInputSchema,

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
    /** Stirrup steel (default CA-50 for stirrups) */
    stirrupSteel: PassiveSteelInputSchema.optional().default("CA-50"),
  }),

  /** Loading */
  loading: z.object({
    /** Design shear force (Vsd) */
    vsd: ShearForceSchema,
  }),

  /** Design parameters */
  parameters: z
    .object({
      /** Effective depth (cm) - required or calculated from cover */
      d: z.number().positive().optional(),
      /** Concrete cover (cm) */
      concreteCover: z.number().positive().optional().default(2.5),
      /** Calculation model (1 = Model I θ=45°, 2 = Model II variable θ) */
      model: z.number().int().min(1).max(2).optional().default(1),
      /** Strut angle θ in degrees (for Model II, 30-45) */
      theta: z.number().min(30).max(45).optional().default(45),
      /** Stirrup inclination α in degrees (90 = vertical) */
      alpha: z.number().min(45).max(90).optional().default(90),
      /** Number of stirrup legs */
      stirrupLegs: z.number().int().min(2).optional().default(2),
    })
    .refine(
      (data) => data.d !== undefined || data.concreteCover !== undefined,
      { message: "Forneça altura útil (d) ou cobrimento (concreteCover)" }
    ),
});

export type ShearDesignInput = z.infer<typeof ShearDesignSchema>;
