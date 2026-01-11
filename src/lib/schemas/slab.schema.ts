/**
 * Slab Design Schema
 */

import { z } from "zod";
import {
  ConcreteInputSchema,
  PassiveSteelInputSchema,
} from "./material.schema";

/**
 * Edge support type
 */
export const EdgeSupportSchema = z
  .enum(["free", "simply", "fixed"])
  .default("simply");

/**
 * Slab geometry schema
 */
export const SlabGeometrySchema = z.object({
  /** Shorter span Lx (cm) */
  Lx: z.number().positive(),
  /** Longer span Ly (cm) */
  Ly: z.number().positive(),
  /** Thickness h (cm) */
  h: z.number().min(5).max(50),
});

/**
 * Slab supports schema
 */
export const SlabSupportsSchema = z
  .object({
    top: EdgeSupportSchema,
    bottom: EdgeSupportSchema,
    left: EdgeSupportSchema,
    right: EdgeSupportSchema,
  })
  .default({
    top: "simply",
    bottom: "simply",
    left: "simply",
    right: "simply",
  });

/**
 * Slab loading schema
 */
export const SlabLoadingSchema = z.object({
  /** Dead load including self-weight (kN/m²) */
  dead: z.number().nonnegative(),
  /** Live load (kN/m²) */
  live: z.number().nonnegative(),
});

/**
 * Slab design schema
 */
export const SlabDesignSchema = z.object({
  /** Slab geometry */
  geometry: SlabGeometrySchema,

  /** Support conditions */
  supports: SlabSupportsSchema,

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
    steel: PassiveSteelInputSchema.optional().default("CA-50"),
  }),

  /** Loading */
  loading: SlabLoadingSchema,

  /** Design parameters */
  parameters: z
    .object({
      /** Concrete cover (cm) */
      cover: z.number().positive().default(2.5),
      /** Slab type */
      slabType: z.enum(["floor", "roof", "cantilever"]).default("floor"),
      /** Load factor */
      gamma_f: z.number().min(1).max(2).default(1.4),
    })
    .default({ cover: 2.5, slabType: "floor", gamma_f: 1.4 }),
});

export type SlabDesignInput = z.infer<typeof SlabDesignSchema>;
