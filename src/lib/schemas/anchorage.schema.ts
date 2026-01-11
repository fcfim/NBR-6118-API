/**
 * Anchorage Schema
 */

import { z } from "zod";
import {
  ConcreteInputSchema,
  PassiveSteelInputSchema,
} from "./material.schema";

/**
 * Bar type options
 */
export const BarTypeSchema = z
  .enum(["smooth", "notched", "ribbed"])
  .default("ribbed");

/**
 * Bond zone options
 */
export const BondZoneSchema = z.enum(["good", "poor"]).default("good");

/**
 * Anchorage type options
 */
export const AnchorageTypeSchema = z
  .enum(["straight", "hook_90", "hook_180", "hook_45"])
  .default("straight");

/**
 * Anchorage calculation schema
 */
export const AnchorageSchema = z.object({
  /** Bar diameter (mm) */
  diameter: z.number().min(5).max(40),

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
    steel: PassiveSteelInputSchema.optional().default("CA-50"),
  }),

  /** Bar configuration */
  configuration: z
    .object({
      /** Bar surface type */
      barType: BarTypeSchema,
      /** Bond zone */
      bondZone: BondZoneSchema,
      /** Anchorage type */
      anchorageType: AnchorageTypeSchema,
    })
    .default({
      barType: "ribbed",
      bondZone: "good",
      anchorageType: "straight",
    }),

  /** Area optimization (optional) */
  areaOptimization: z
    .object({
      /** Calculated required area (cm²) */
      As_calc: z.number().positive(),
      /** Effective area provided (cm²) */
      As_ef: z.number().positive(),
    })
    .optional(),

  /** Splice parameters (optional) */
  splice: z
    .object({
      /** Percentage of bars spliced at same section (%) */
      percentage: z.number().min(0).max(100),
      /** Spacing between spliced bar axes (cm) */
      spacing: z.number().positive(),
    })
    .optional(),
});

export type AnchorageInput = z.infer<typeof AnchorageSchema>;
