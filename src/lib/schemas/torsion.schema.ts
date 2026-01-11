/**
 * Torsion Design Schema
 */

import { z } from "zod";
import { SectionInputSchema } from "./section.schema";
import {
  ConcreteInputSchema,
  PassiveSteelInputSchema,
} from "./material.schema";

/**
 * Torsion moment schema with unit conversion
 */
export const TorsionMomentSchema = z
  .union([
    z.number(),
    z.object({
      value: z.number(),
      unit: z.enum(["kN.cm", "kN.m", "tf.m", "kgf.m"]),
    }),
  ])
  .transform((val) => {
    if (typeof val === "number") return val;
    const factors: Record<string, number> = {
      "kN.cm": 1,
      "kN.m": 100,
      "tf.m": 980.665,
      "kgf.m": 0.980665,
    };
    return val.value * (factors[val.unit] || 1);
  });

/**
 * Shear force schema with unit conversion
 */
export const ShearForceSchema = z
  .union([
    z.number(),
    z.object({
      value: z.number(),
      unit: z.enum(["kN", "tf", "kgf"]),
    }),
  ])
  .transform((val) => {
    if (typeof val === "number") return val;
    const factors: Record<string, number> = {
      kN: 1,
      tf: 9.80665,
      kgf: 0.00980665,
    };
    return val.value * (factors[val.unit] || 1);
  });

/**
 * Torsion design schema
 */
export const TorsionDesignSchema = z.object({
  /** Section geometry */
  section: SectionInputSchema,

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
    steel: PassiveSteelInputSchema.optional().default("CA-50"),
  }),

  /** Loading */
  loading: z.object({
    /** Design torsion moment */
    tsd: TorsionMomentSchema,
    /** Design shear force (for interaction check) */
    vsd: ShearForceSchema.optional(),
    /** VRd2 from shear calculation (kN) for interaction */
    vrd2: z.number().positive().optional(),
  }),

  /** Design parameters */
  parameters: z
    .object({
      /** Effective depth (cm) */
      d: z.number().positive().optional(),
      /** Concrete cover (cm) */
      cover: z.number().positive().default(2.5),
    })
    .default({ cover: 2.5 }),
});

export type TorsionDesignInput = z.infer<typeof TorsionDesignSchema>;
