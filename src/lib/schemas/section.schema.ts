/**
 * Section Validation Schemas
 *
 * Zod schemas for validating section geometry input.
 * Supports multiple units with automatic normalization.
 */

import { z } from "zod";

/**
 * Distance schema - accepts number (assumes cm) or object with unit
 */
export const DistanceSchema = z.union([
  z
    .number()
    .positive()
    .transform((val) => ({ value: val, unit: "cm" as const })),
  z.object({
    value: z.number().positive(),
    unit: z.enum(["mm", "cm", "m"]),
  }),
]);

export type DistanceInput = z.input<typeof DistanceSchema>;
export type DistanceValue = z.output<typeof DistanceSchema>;

/**
 * Rectangular section schema
 */
export const RectangularSectionSchema = z.object({
  type: z.literal("rectangular"),
  /** Width (base) of the section */
  width: DistanceSchema,
  /** Height of the section */
  height: DistanceSchema,
});

/**
 * T-section schema
 */
export const TSectionSchema = z.object({
  type: z.literal("T"),
  /** Flange width (largura da mesa) */
  bf: DistanceSchema,
  /** Flange height (altura da mesa) */
  hf: DistanceSchema,
  /** Web width (largura da alma) */
  bw: DistanceSchema,
  /** Total height (altura total) */
  h: DistanceSchema,
});

/**
 * I-section schema
 */
export const ISectionSchema = z.object({
  type: z.literal("I"),
  /** Top flange width */
  bf: DistanceSchema,
  /** Top flange height */
  hf: DistanceSchema,
  /** Web width */
  bw: DistanceSchema,
  /** Total height */
  h: DistanceSchema,
  /** Bottom flange width */
  bi: DistanceSchema,
  /** Bottom flange height */
  hi: DistanceSchema,
});

/**
 * Discriminated union for all section types
 */
export const SectionInputSchema = z.discriminatedUnion("type", [
  RectangularSectionSchema,
  TSectionSchema,
  ISectionSchema,
]);

export type SectionInput = z.infer<typeof SectionInputSchema>;
export type RectangularSectionInput = z.infer<typeof RectangularSectionSchema>;
export type TSectionInput = z.infer<typeof TSectionSchema>;
export type ISectionInput = z.infer<typeof ISectionSchema>;
