/**
 * Column Design Validation Schema
 */

import { z } from "zod";
import {
  ConcreteInputSchema,
  PassiveSteelInputSchema,
} from "./material.schema";

/**
 * Column geometry schema
 */
export const ColumnGeometrySchema = z.object({
  /** Width in x direction (cm) */
  bx: z.number().min(15).max(200),
  /** Width in y direction (cm) */
  by: z.number().min(15).max(200),
});

/**
 * Support condition schema
 */
export const ColumnSupportsSchema = z.object({
  top: z.enum(["fixed", "pinned"]).default("fixed"),
  bottom: z.enum(["fixed", "pinned"]).default("fixed"),
});

/**
 * Column loading schema
 */
export const ColumnLoadingSchema = z.object({
  /** Design axial force (kN) - positive for compression */
  nd: z.number().positive(),
  /** First-order moment at top - x direction (kN.cm) */
  mx_top: z.number().optional().default(0),
  /** First-order moment at bottom - x direction (kN.cm) */
  mx_bot: z.number().optional().default(0),
  /** First-order moment at top - y direction (kN.cm) */
  my_top: z.number().optional().default(0),
  /** First-order moment at bottom - y direction (kN.cm) */
  my_bot: z.number().optional().default(0),
});

/**
 * Column design schema
 */
export const ColumnDesignSchema = z.object({
  /** Column geometry */
  geometry: ColumnGeometrySchema,

  /** Column length (cm or with unit) */
  length: z
    .union([
      z.number().positive(),
      z.object({
        value: z.number().positive(),
        unit: z.enum(["cm", "m"]),
      }),
    ])
    .transform((val) => {
      if (typeof val === "number") return val;
      return val.unit === "m" ? val.value * 100 : val.value;
    }),

  /** Support conditions */
  supports: ColumnSupportsSchema.optional().default({
    top: "fixed",
    bottom: "fixed",
  }),

  /** Materials */
  materials: z.object({
    concrete: ConcreteInputSchema,
    steel: PassiveSteelInputSchema.optional().default("CA-50"),
  }),

  /** Loading */
  loading: ColumnLoadingSchema,

  /** Design parameters */
  parameters: z
    .object({
      /** Concrete cover (cm) */
      cover: z.number().positive().default(3),
      /** Stirrup diameter (mm) */
      stirrupDiameter: z.number().positive().default(5),
      /** Estimated main bar diameter (mm) */
      mainBarDiameter: z.number().positive().default(16),
    })
    .default({ cover: 3, stirrupDiameter: 5, mainBarDiameter: 16 }),
});

export type ColumnDesignInput = z.infer<typeof ColumnDesignSchema>;
