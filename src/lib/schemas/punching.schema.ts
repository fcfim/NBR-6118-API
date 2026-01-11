/**
 * Punching Shear Schema
 */

import { z } from "zod";
import { ConcreteInputSchema } from "./material.schema";

/**
 * Pillar type
 */
export const PillarTypeSchema = z
  .enum(["internal", "edge", "corner"])
  .default("internal");

/**
 * Punching verification schema
 */
export const PunchingVerificationSchema = z.object({
  /** Slab properties */
  slab: z.object({
    /** Thickness (cm) */
    h: z.number().positive(),
    /** Effective depth x (cm) - optional, calculated from h if not provided */
    dx: z.number().positive().optional(),
    /** Effective depth y (cm) - optional, calculated from h if not provided */
    dy: z.number().positive().optional(),
  }),

  /** Pillar properties */
  pillar: z.object({
    /** Dimension a (cm) */
    a: z.number().positive(),
    /** Dimension b (cm) */
    b: z.number().positive(),
    /** Pillar position */
    type: PillarTypeSchema,
  }),

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
  }),

  /** Loading */
  loading: z.object({
    /** Design punching force (kN) */
    fsd: z.number().positive(),
  }),

  /** Reinforcement ratios */
  reinforcement: z
    .object({
      /** Reinforcement ratio in x direction */
      rho_x: z.number().min(0.001).max(0.04).default(0.005),
      /** Reinforcement ratio in y direction */
      rho_y: z.number().min(0.001).max(0.04).default(0.005),
    })
    .default({ rho_x: 0.005, rho_y: 0.005 }),
});

export type PunchingVerificationInput = z.infer<
  typeof PunchingVerificationSchema
>;
