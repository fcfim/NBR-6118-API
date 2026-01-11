/**
 * Cracking Verification Schema
 */

import { z } from "zod";
import { SectionInputSchema } from "./section.schema";
import { ConcreteInputSchema } from "./material.schema";
import { MomentSchema } from "./load.schema";

/**
 * Environmental aggressiveness class
 */
export const EnvironmentClassSchema = z
  .enum(["I", "II", "III", "IV"])
  .default("II");

/**
 * Cracking verification schema
 */
export const CrackingVerificationSchema = z.object({
  /** Bar diameter used (mm) */
  diameter: z.number().min(5).max(40),

  /** Section geometry (for effective depth if not provided) */
  section: SectionInputSchema.optional(),

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
  }),

  /** Loading - service moment */
  loading: z.object({
    /** Service moment (ELS frequent or quasi-permanent) */
    ms: MomentSchema,
  }),

  /** Steel area provided */
  reinforcement: z.object({
    /** Steel area (cm²) */
    As: z.number().positive(),
    /** Effective depth (cm) - required if section not provided */
    d: z.number().positive().optional(),
  }),

  /** Environment */
  environment: z
    .object({
      /** Aggressiveness class */
      class: EnvironmentClassSchema,
    })
    .default({ class: "II" }),
});

export type CrackingVerificationInput = z.infer<
  typeof CrackingVerificationSchema
>;
