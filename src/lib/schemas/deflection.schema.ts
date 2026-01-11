/**
 * Deflection Verification Schema
 */

import { z } from "zod";
import { SectionInputSchema } from "./section.schema";
import { ConcreteInputSchema } from "./material.schema";
import { MomentSchema, SpanSchema } from "./load.schema";

/**
 * Deflection verification schema
 */
export const DeflectionVerificationSchema = z.object({
  /** Section geometry */
  section: SectionInputSchema,

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
  }),

  /** Loading - service moment (ELS) */
  loading: z.object({
    /** Service moment (quasi-permanent) */
    ma: MomentSchema,
    /** Beam span */
    span: SpanSchema,
  }),

  /** Design parameters */
  parameters: z.object({
    /** Effective depth (cm) */
    d: z.number().positive().optional(),
    /** Concrete cover (cm) */
    concreteCover: z.number().positive().optional().default(2.5),
    /** Beam type */
    beamType: z
      .enum(["simple", "cantilever", "continuous"])
      .optional()
      .default("simple"),
    /** Loading duration in months (affects creep) */
    loadingDuration: z.number().positive().optional().default(60),
    /** Compression reinforcement ratio ρ' (decimal) */
    rho_prime: z.number().min(0).max(0.04).optional().default(0),
    /** Tension steel area (cm²) - for more accurate III calculation */
    As: z.number().positive().optional(),
  }),
});

export type DeflectionVerificationInput = z.infer<
  typeof DeflectionVerificationSchema
>;
