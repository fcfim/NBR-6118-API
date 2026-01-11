/**
 * Steel Properties Data - NBR 6118:2023
 *
 * Properties for passive reinforcement steel (armadura passiva)
 * and active prestressing steel (armadura ativa/protensão).
 *
 * ## Passive Steel (Section 8.3 - NBR 6118:2023)
 *
 * Categories:
 * - CA-25: fyk = 250 MPa (smooth bars - barras lisas)
 * - CA-50: fyk = 500 MPa (ribbed bars - barras nervuradas)
 * - CA-60: fyk = 600 MPa (cold-drawn wire - fios)
 *
 * ### Common Properties
 * - Modulus of elasticity: Es = 210 GPa
 * - Design yield strength: fyd = fyk / γs
 * - γs = 1.15 (normal combinations)
 * - Maximum strain: εsu = 10‰
 * - Yield strain: εyd = fyd / Es
 *
 * ### Bond Coefficients (η1) - Table 8.3 NBR 6118:2023
 * - CA-25 (smooth): η1 = 1.0
 * - CA-50 (ribbed): η1 = 2.25
 * - CA-60 (wire): η1 = 1.0
 *
 * ## Active Steel (Prestressing) - Section 8.4
 *
 * Types:
 * - CP-175/190/210 RB (Relaxation Baixa - Low Relaxation)
 * - CP-150/160/170 RN (Relaxation Normal)
 *
 * ### Properties
 * - Ep = 200 GPa (wires), 195 GPa (strands)
 * - fptk = characteristic tensile strength
 * - fpyk = 0.9 × fptk (low relaxation)
 */

export interface PassiveSteelProperties {
  /** Category name */
  category: string;
  /** Characteristic yield strength (MPa) */
  fyk: number;
  /** Design yield strength (MPa) - fyk/1.15 */
  fyd: number;
  /** Modulus of elasticity (GPa) */
  Es: number;
  /** Yield strain (‰) */
  epsilon_yd: number;
  /** Ultimate strain (‰) */
  epsilon_su: number;
  /** Bond coefficient η1 */
  eta1: number;
  /** Description */
  description: string;
}

export interface ActiveSteelProperties {
  /** Designation */
  designation: string;
  /** Characteristic tensile strength (MPa) */
  fptk: number;
  /** Characteristic yield strength (MPa) */
  fpyk: number;
  /** Modulus of elasticity (GPa) */
  Ep: number;
  /** Relaxation type */
  relaxation: "RB" | "RN";
  /** Steel type */
  type: "wire" | "strand";
  /** Description */
  description: string;
}

/**
 * Passive reinforcement steel classes
 */
export const PASSIVE_STEEL_CLASSES: Record<string, PassiveSteelProperties> = {
  "CA-25": {
    category: "CA-25",
    fyk: 250,
    fyd: 250 / 1.15,
    Es: 210,
    epsilon_yd: (250 / 1.15 / 210000) * 1000, // ≈ 1.035‰
    epsilon_su: 10,
    eta1: 1.0,
    description: "Barras lisas de aço classe A",
  },
  "CA-50": {
    category: "CA-50",
    fyk: 500,
    fyd: 500 / 1.15,
    Es: 210,
    epsilon_yd: (500 / 1.15 / 210000) * 1000, // ≈ 2.07‰
    epsilon_su: 10,
    eta1: 2.25,
    description: "Barras nervuradas de aço classe A",
  },
  "CA-60": {
    category: "CA-60",
    fyk: 600,
    fyd: 600 / 1.15,
    Es: 210,
    epsilon_yd: (600 / 1.15 / 210000) * 1000, // ≈ 2.48‰
    epsilon_su: 10,
    eta1: 1.0,
    description: "Fios de aço trefilado",
  },
};

/**
 * Active (prestressing) steel classes
 */
export const ACTIVE_STEEL_CLASSES: Record<string, ActiveSteelProperties> = {
  "CP-175-RB": {
    designation: "CP-175-RB",
    fptk: 1750,
    fpyk: 1575, // 0.9 × 1750
    Ep: 200,
    relaxation: "RB",
    type: "wire",
    description: "Fios de protensão - relaxação baixa",
  },
  "CP-190-RB": {
    designation: "CP-190-RB",
    fptk: 1900,
    fpyk: 1710, // 0.9 × 1900
    Ep: 200,
    relaxation: "RB",
    type: "wire",
    description: "Fios de protensão - relaxação baixa",
  },
  "CP-210-RB": {
    designation: "CP-210-RB",
    fptk: 2100,
    fpyk: 1890, // 0.9 × 2100
    Ep: 200,
    relaxation: "RB",
    type: "wire",
    description: "Fios de protensão - relaxação baixa",
  },
  "CP-190-RB-STRAND": {
    designation: "CP-190-RB (Cordoalha)",
    fptk: 1900,
    fpyk: 1710,
    Ep: 195,
    relaxation: "RB",
    type: "strand",
    description: "Cordoalhas de 7 fios - relaxação baixa",
  },
  "CP-150-RN": {
    designation: "CP-150-RN",
    fptk: 1500,
    fpyk: 1200, // 0.8 × 1500
    Ep: 200,
    relaxation: "RN",
    type: "wire",
    description: "Fios de protensão - relaxação normal",
  },
};

/**
 * Get list of available passive steel class names
 */
export const PASSIVE_STEEL_NAMES = Object.keys(PASSIVE_STEEL_CLASSES);

/**
 * Get list of available active steel class names
 */
export const ACTIVE_STEEL_NAMES = Object.keys(ACTIVE_STEEL_CLASSES);

/**
 * Safety coefficient for steel (γs)
 * - Normal/Special/Construction combinations: 1.15
 * - Exceptional combinations: 1.0
 */
export const GAMMA_S = {
  normal: 1.15,
  exceptional: 1.0,
};

/**
 * Common rebar diameters (mm) for Brazilian market
 */
export const REBAR_DIAMETERS = {
  "CA-50": [6.3, 8.0, 10.0, 12.5, 16.0, 20.0, 25.0, 32.0, 40.0],
  "CA-60": [5.0, 6.0, 7.0, 8.0, 9.5, 10.0],
  "CA-25": [6.3, 8.0, 10.0, 12.5, 16.0, 20.0, 25.0],
};

/**
 * Calculate rebar area (cm²) from diameter (mm)
 */
export function rebarArea(diameter_mm: number): number {
  return (Math.PI * Math.pow(diameter_mm, 2)) / 400;
}

/**
 * Calculate number of rebars needed for given area
 */
export function rebarsNeeded(
  requiredArea_cm2: number,
  diameter_mm: number
): number {
  const singleArea = rebarArea(diameter_mm);
  return Math.ceil(requiredArea_cm2 / singleArea);
}
