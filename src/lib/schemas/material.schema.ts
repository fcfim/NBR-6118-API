/**
 * Material Validation Schemas
 *
 * Zod schemas for validating material specifications.
 * Accepts either standard class names (e.g., "C25", "CA-50")
 * or custom property objects.
 */

import { z } from "zod";
import { CONCRETE_CLASS_NAMES } from "@/data/materials/concrete.data";
import {
  PASSIVE_STEEL_NAMES,
  ACTIVE_STEEL_NAMES,
} from "@/data/materials/steel.data";

/**
 * Concrete input schema
 * Accepts: "C25" | "C30" | ... | { fck: 33, unit?: "MPa" }
 */
export const ConcreteInputSchema = z.union([
  // Standard class name
  z.enum(CONCRETE_CLASS_NAMES as [string, ...string[]]),
  // Custom fck value
  z.object({
    fck: z
      .number()
      .min(20, "fck mínimo é 20 MPa")
      .max(90, "fck máximo é 90 MPa"),
    unit: z.enum(["MPa", "kN/cm2"]).optional().default("MPa"),
    aggregate: z
      .enum(["basalt", "granite", "limestone", "sandstone"])
      .optional()
      .default("granite"),
  }),
]);

export type ConcreteInput = z.infer<typeof ConcreteInputSchema>;

/**
 * Passive steel input schema
 * Accepts: "CA-25" | "CA-50" | "CA-60"
 */
export const PassiveSteelInputSchema = z.enum(
  PASSIVE_STEEL_NAMES as [string, ...string[]]
);

export type PassiveSteelInput = z.infer<typeof PassiveSteelInputSchema>;

/**
 * Active steel input schema
 * Accepts prestressing steel designations
 */
export const ActiveSteelInputSchema = z.enum(
  ACTIVE_STEEL_NAMES as [string, ...string[]]
);

export type ActiveSteelInput = z.infer<typeof ActiveSteelInputSchema>;

/**
 * Combined material request schema
 * For endpoints that need multiple material properties
 */
export const MaterialRequestSchema = z
  .object({
    concrete: ConcreteInputSchema.optional(),
    passiveSteel: PassiveSteelInputSchema.optional(),
    activeSteel: ActiveSteelInputSchema.optional(),
  })
  .refine((data) => data.concrete || data.passiveSteel || data.activeSteel, {
    message: "At least one material must be specified",
  });

export type MaterialRequest = z.infer<typeof MaterialRequestSchema>;
