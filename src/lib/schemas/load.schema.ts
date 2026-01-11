/**
 * Load Validation Schemas
 *
 * Zod schemas for load input and combination parameters.
 */

import { z } from "zod";
import {
  BUILDING_TYPE_NAMES,
  SAFETY_FACTOR_NAMES,
} from "@/data/loads/coefficients.data";

/**
 * Load value schema - accepts number (assumes kN/m) or object with unit
 */
export const LoadValueSchema = z.union([
  z.number().transform((val) => ({ value: val, unit: "kN/m" as const })),
  z.object({
    value: z.number(),
    unit: z.enum(["kN/m", "kN/cm", "tf/m", "kgf/m"]),
  }),
]);

export type LoadValue = z.infer<typeof LoadValueSchema>;

/**
 * Distance schema for span
 */
export const SpanSchema = z.union([
  z
    .number()
    .positive()
    .transform((val) => ({ value: val, unit: "cm" as const })),
  z.object({
    value: z.number().positive(),
    unit: z.enum(["mm", "cm", "m"]),
  }),
]);

/**
 * Moment schema
 */
export const MomentSchema = z.union([
  z.number().transform((val) => ({ value: val, unit: "kN.cm" as const })),
  z.object({
    value: z.number(),
    unit: z.enum(["kN.cm", "kN.m", "tf.m", "kgf.m"]),
  }),
]);

export type MomentValue = z.infer<typeof MomentSchema>;

/**
 * Load combination parameters schema
 */
export const LoadParametersSchema = z
  .object({
    /** Building type for automatic ψ coefficient lookup */
    buildingType: z
      .enum(BUILDING_TYPE_NAMES as [string, ...string[]])
      .optional(),
    /** Manual ψ0 override */
    psi0: z.number().min(0).max(1).optional(),
    /** Manual ψ1 override */
    psi1: z.number().min(0).max(1).optional(),
    /** Manual ψ2 override */
    psi2: z.number().min(0).max(1).optional(),
    /** Safety factor type */
    combinationType: z
      .enum(SAFETY_FACTOR_NAMES as [string, ...string[]])
      .optional()
      .default("NORMAL"),
    /** Manual γg override */
    gamma_g: z.number().min(1).max(2).optional(),
    /** Manual γq override */
    gamma_q: z.number().min(1).max(2).optional(),
  })
  .refine(
    (data) =>
      data.buildingType || (data.psi1 !== undefined && data.psi2 !== undefined),
    { message: "Informe buildingType ou forneça psi1 e psi2 manualmente" }
  );

/**
 * Simple beam load calculation schema
 * For calculating moments from distributed loads on a simply supported beam
 */
export const SimpleBeamLoadSchema = z.object({
  /** Beam span */
  span: SpanSchema,
  /** Distributed loads */
  loads: z.object({
    /** Permanent load - self weight + dead load (g1) */
    g1: LoadValueSchema,
    /** Additional permanent load - finishes, etc. (g2) */
    g2: LoadValueSchema.optional(),
    /** Variable load - live load (q) */
    q: LoadValueSchema,
  }),
  /** Combination parameters */
  parameters: LoadParametersSchema,
});

export type SimpleBeamLoadInput = z.infer<typeof SimpleBeamLoadSchema>;

/**
 * Direct moment input schema
 * For when moments are already calculated
 */
export const DirectMomentSchema = z.object({
  /** Characteristic moment from permanent loads */
  Mk_g: MomentSchema,
  /** Characteristic moment from variable loads */
  Mk_q: MomentSchema,
  /** Combination parameters */
  parameters: LoadParametersSchema,
});

export type DirectMomentInput = z.infer<typeof DirectMomentSchema>;
