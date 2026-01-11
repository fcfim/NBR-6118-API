/**
 * Beam Design Validation Schemas
 *
 * Zod schemas for reinforced concrete beam design input.
 */

import { z } from "zod";
import { SectionInputSchema } from "./section.schema";
import {
  ConcreteInputSchema,
  PassiveSteelInputSchema,
} from "./material.schema";
import { MomentSchema } from "./load.schema";

/**
 * Effective depth (d) input schema
 */
export const EffectiveDepthSchema = z
  .object({
    /** Effective depth value */
    d: z.number().positive().optional(),
    /** Concrete cover (cobrimento) */
    concreteCover: z.number().positive().optional(),
    /** Stirrup diameter (assumed 5mm if not provided) */
    stirrupDiameter: z.number().positive().optional().default(5),
    /** Main bar diameter (assumed 12.5mm if not provided) */
    mainBarDiameter: z.number().positive().optional().default(12.5),
    /** Unit for d and cover */
    unit: z.enum(["mm", "cm"]).optional().default("cm"),
  })
  .refine((data) => data.d !== undefined || data.concreteCover !== undefined, {
    message: "Forneça altura útil (d) ou cobrimento (concreteCover)",
  });

/**
 * Longitudinal reinforcement design schema
 */
export const LongitudinalDesignSchema = z.object({
  /** Section geometry */
  section: SectionInputSchema,

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
    steel: PassiveSteelInputSchema.optional().default("CA-50"),
  }),

  /** Loading */
  loading: z.object({
    /** Characteristic bending moment (Mk) */
    mk: MomentSchema,
    /** Safety factor (default 1.4) */
    gamma_f: z.number().min(1).max(2).optional().default(1.4),
  }),

  /** Design parameters */
  parameters: EffectiveDepthSchema,
});

export type LongitudinalDesignInput = z.infer<typeof LongitudinalDesignSchema>;

/**
 * Shear design schema (for future implementation)
 */
export const ShearDesignSchema = z.object({
  /** Section geometry */
  section: SectionInputSchema,

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
    steel: PassiveSteelInputSchema.optional().default("CA-50"),
  }),

  /** Loading */
  loading: z.object({
    /** Design shear force (Vsd) */
    vsd: z.object({
      value: z.number(),
      unit: z.enum(["kN", "tf"]).default("kN"),
    }),
  }),

  /** Design parameters */
  parameters: EffectiveDepthSchema.extend({
    /** Stirrup configuration */
    stirrups: z
      .object({
        legs: z.number().int().positive().default(2),
        diameter: z.number().positive().optional(),
      })
      .optional(),
  }),
});

export type ShearDesignInput = z.infer<typeof ShearDesignSchema>;
