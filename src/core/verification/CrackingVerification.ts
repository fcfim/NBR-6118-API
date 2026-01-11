/**
 * Cracking Verification - NBR 6118:2023
 *
 * Calculates crack width (wk) for serviceability limit state.
 *
 * ## Crack Width (wk) - Item 17.3.3
 *
 * Simplified formula:
 * - wk = (φ / 12.5 × η1) × (σsi / Esi) × (3 × σsi / fctm)
 *
 * Which simplifies to:
 * - wk = (3 × φ × σsi²) / (12.5 × η1 × Esi × fctm)
 *
 * ## Steel Stress (σsi)
 * - σsi = Ms / (As × z)
 * - z ≈ 0.9d (approximate lever arm)
 *
 * ## Crack Width Limits (Table 13.4)
 * - CAA I (rural): wk ≤ 0.4mm
 * - CAA II (urban): wk ≤ 0.3mm
 * - CAA III (marine): wk ≤ 0.3mm
 * - CAA IV (industrial): wk ≤ 0.2mm
 *
 * ## Maximum Bar Spacing (Item 17.3.3.3)
 * To dispense crack calculation, spacing must respect limits
 * based on steel stress and bar diameter.
 */

export interface CrackingParams {
  /** Bar diameter (mm) */
  diameter: number;
  /** Service moment (kN.cm) */
  Ms: number;
  /** Steel area provided (cm²) */
  As: number;
  /** Effective depth (cm) */
  d: number;
  /** Mean tensile strength (MPa) */
  fctm: number;
  /** Steel modulus of elasticity (GPa) */
  Es?: number;
  /** Bond coefficient η1 */
  eta1?: number;
  /** Environmental aggressiveness class */
  environmentClass?: "I" | "II" | "III" | "IV";
}

export interface CrackingResult {
  /** Inputs summary */
  inputs: {
    diameter: number;
    Ms: number;
    As: number;
    d: number;
  };
  /** Stress calculation */
  stress: {
    /** Lever arm z (cm) */
    z: number;
    /** Steel stress σsi (MPa) */
    sigma_si: number;
    /** Steel stress limit for crack control */
    sigma_limit: number;
  };
  /** Crack width */
  cracking: {
    /** Calculated crack width wk (mm) */
    wk: number;
    /** Maximum allowed wk (mm) */
    wk_limit: number;
    /** Environmental class */
    environmentClass: string;
  };
  /** Spacing verification */
  spacing: {
    /** Maximum bar spacing (cm) */
    s_max: number;
    /** Can dispense crack calculation? */
    canDispenseCalculation: boolean;
  };
  /** Status */
  status: {
    isValid: boolean;
    utilizationRatio: number;
    messages: string[];
  };
}

/**
 * Get crack width limit based on environmental class
 */
function getCrackLimit(
  environmentClass: CrackingParams["environmentClass"]
): number {
  switch (environmentClass) {
    case "I":
      return 0.4;
    case "II":
      return 0.3;
    case "III":
      return 0.3;
    case "IV":
      return 0.2;
    default:
      return 0.3;
  }
}

/**
 * Get environmental class description
 */
function getEnvironmentDescription(
  environmentClass: CrackingParams["environmentClass"]
): string {
  switch (environmentClass) {
    case "I":
      return "CAA I - Rural";
    case "II":
      return "CAA II - Urbana";
    case "III":
      return "CAA III - Marinha";
    case "IV":
      return "CAA IV - Industrial";
    default:
      return "CAA II - Urbana";
  }
}

/**
 * Get maximum bar spacing based on steel stress (Table 17.2)
 * Simplified approximation
 */
function getMaxSpacing(sigma_si: number, diameter: number): number {
  // Based on Table 17.2 NBR 6118
  // For ribbed bars (η1 = 2.25)

  if (sigma_si <= 160) {
    if (diameter <= 10) return 30;
    if (diameter <= 16) return 25;
    if (diameter <= 20) return 20;
    return 15;
  } else if (sigma_si <= 200) {
    if (diameter <= 10) return 25;
    if (diameter <= 16) return 20;
    if (diameter <= 20) return 15;
    return 10;
  } else if (sigma_si <= 240) {
    if (diameter <= 10) return 20;
    if (diameter <= 16) return 15;
    if (diameter <= 20) return 10;
    return 10;
  } else if (sigma_si <= 280) {
    if (diameter <= 10) return 15;
    if (diameter <= 16) return 10;
    return 10;
  } else {
    return 10;
  }
}

/**
 * Calculate crack width verification
 */
export function verifyCracking(params: CrackingParams): CrackingResult {
  const {
    diameter,
    Ms,
    As,
    d,
    fctm,
    Es = 210, // GPa
    eta1 = 2.25, // ribbed bars
    environmentClass = "II",
  } = params;

  const messages: string[] = [];

  // Lever arm (approximate)
  const z = 0.9 * d; // cm

  // Steel stress
  // σsi = Ms / (As × z)
  // Ms in kN.cm, As in cm², z in cm → σsi in kN/cm²
  // Convert to MPa: multiply by 10
  const sigma_si_kN_cm2 = Ms / (As * z);
  const sigma_si = sigma_si_kN_cm2 * 10; // MPa

  // Steel modulus in MPa
  const Esi = Es * 1000; // GPa to MPa

  // Crack width calculation
  // wk = (3 × φ × σsi²) / (12.5 × η1 × Esi × fctm)
  // φ in mm, σsi and fctm in MPa, Esi in MPa → wk in mm
  const wk = (3 * diameter * sigma_si * sigma_si) / (12.5 * eta1 * Esi * fctm);

  // Crack width limit
  const wk_limit = getCrackLimit(environmentClass);

  // Maximum spacing
  const s_max = getMaxSpacing(sigma_si, diameter);
  const canDispenseCalculation = sigma_si <= 160;

  // Stress limit (approximate for crack control)
  const sigma_limit = 400 / 1.15; // fyd for CA-50, roughly

  // Status
  const isValid = wk <= wk_limit;
  const utilizationRatio = wk / wk_limit;

  if (isValid) {
    messages.push(
      `✅ wk = ${wk.toFixed(3)}mm ≤ ${wk_limit}mm (${getEnvironmentDescription(
        environmentClass
      )})`
    );
  } else {
    messages.push(
      `❌ wk = ${wk.toFixed(3)}mm > ${wk_limit}mm - Fissuração excessiva`
    );
  }

  if (sigma_si > 240) {
    messages.push(
      `⚠️ σsi = ${sigma_si.toFixed(1)} MPa - Tensão elevada na armadura`
    );
  }

  if (canDispenseCalculation) {
    messages.push("ℹ️ σsi ≤ 160 MPa - Pode dispensar verificação de wk");
  }

  messages.push(`ℹ️ Espaçamento máximo: ${s_max} cm`);

  return {
    inputs: {
      diameter,
      Ms,
      As,
      d,
    },
    stress: {
      z,
      sigma_si,
      sigma_limit,
    },
    cracking: {
      wk,
      wk_limit,
      environmentClass: getEnvironmentDescription(environmentClass),
    },
    spacing: {
      s_max,
      canDispenseCalculation,
    },
    status: {
      isValid,
      utilizationRatio,
      messages,
    },
  };
}
