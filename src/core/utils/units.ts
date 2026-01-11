/**
 * Unit conversion utilities for structural engineering calculations
 * Following NBR 6118:2023 conventions
 *
 * Standard internal units:
 * - Length: cm
 * - Force: kN
 * - Stress: kN/cm² (1 MPa = 0.1 kN/cm²)
 * - Moment: kN.cm
 */

export interface ValueWithUnit {
  value: number;
  unit: string;
}

// Length conversion factors to centimeters
const LENGTH_TO_CM: Record<string, number> = {
  mm: 0.1,
  cm: 1,
  m: 100,
};

// Force conversion factors to kN
const FORCE_TO_KN: Record<string, number> = {
  N: 0.001,
  kN: 1,
  tf: 9.80665,
  kgf: 0.00980665,
};

// Stress conversion factors to kN/cm²
const STRESS_TO_KN_CM2: Record<string, number> = {
  MPa: 0.1,
  "kN/cm²": 1,
  "kN/cm2": 1,
  GPa: 100,
  "kgf/cm²": 0.00980665,
  "kgf/cm2": 0.00980665,
};

// Distributed load conversion to kN/cm
const DISTRIBUTED_LOAD_TO_KN_CM: Record<string, number> = {
  "kN/m": 0.01,
  "kN/cm": 1,
  "tf/m": 0.0980665,
  "kgf/m": 0.0000980665,
};

// Moment conversion to kN.cm
const MOMENT_TO_KN_CM: Record<string, number> = {
  "kN.cm": 1,
  "kN*cm": 1,
  "kN.m": 100,
  "kN*m": 100,
  "tf.m": 980.665,
  "tf*m": 980.665,
  "kgf.m": 0.980665,
  "kgf.cm": 0.00980665,
};

/**
 * Convert length to centimeters
 */
export function toCm(input: number | ValueWithUnit): number {
  if (typeof input === "number") return input;
  const factor = LENGTH_TO_CM[input.unit];
  if (!factor) throw new Error(`Unknown length unit: ${input.unit}`);
  return input.value * factor;
}

/**
 * Convert force to kN
 */
export function toKN(input: number | ValueWithUnit): number {
  if (typeof input === "number") return input;
  const factor = FORCE_TO_KN[input.unit];
  if (!factor) throw new Error(`Unknown force unit: ${input.unit}`);
  return input.value * factor;
}

/**
 * Convert stress to kN/cm²
 */
export function toKNcm2(input: number | ValueWithUnit): number {
  if (typeof input === "number") return input;
  const factor = STRESS_TO_KN_CM2[input.unit];
  if (!factor) throw new Error(`Unknown stress unit: ${input.unit}`);
  return input.value * factor;
}

/**
 * Convert stress from MPa to kN/cm²
 */
export function MPaToKNcm2(mpa: number): number {
  return mpa * 0.1;
}

/**
 * Convert stress from kN/cm² to MPa
 */
export function KNcm2ToMPa(kncm2: number): number {
  return kncm2 * 10;
}

/**
 * Convert distributed load to kN/cm
 */
export function toKNperCm(input: number | ValueWithUnit): number {
  if (typeof input === "number") return input;
  const factor = DISTRIBUTED_LOAD_TO_KN_CM[input.unit];
  if (!factor) throw new Error(`Unknown distributed load unit: ${input.unit}`);
  return input.value * factor;
}

/**
 * Convert moment to kN.cm
 */
export function toKNcm(input: number | ValueWithUnit): number {
  if (typeof input === "number") return input;
  const factor = MOMENT_TO_KN_CM[input.unit];
  if (!factor) throw new Error(`Unknown moment unit: ${input.unit}`);
  return input.value * factor;
}

/**
 * Convert area from cm² to m²
 */
export function cm2ToM2(cm2: number): number {
  return cm2 / 10000;
}

/**
 * Convert moment of inertia from cm⁴ to m⁴
 */
export function cm4ToM4(cm4: number): number {
  return cm4 / 100000000;
}
