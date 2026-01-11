/**
 * Shear Design Core Logic - NBR 6118:2023
 *
 * Calculates shear reinforcement for beams according to Section 17.4.
 *
 * ## Verification Models (Item 17.4.2)
 *
 * ### Model I (θ = 45°)
 * - VRd2 = 0.27 × αv2 × fcd × bw × d
 * - Vc = 0.6 × fctd × bw × d  (for simple flexure)
 * - Vsw = Vsd - Vc
 * - Asw/s = Vsw / (0.9 × d × fywd)
 *
 * ### Model II (Variable θ)
 * - More economical for high shear
 * - θ between 30° and 45°
 * - VRd2 = 0.54 × αv2 × fcd × bw × d × sin²θ × (cotθ + cotα)
 *
 * ## Key Parameters
 * - αv2 = 1 - fck/250 (strength reduction factor)
 * - fctd = fctk,inf / γc
 * - fywd = fyk / γs (limited to 435 MPa per NBR 6118)
 *
 * ## Minimum Stirrup Reinforcement (Item 17.4.1.1)
 * - ρsw,min = 0.2 × fctm / fyk (in decimal)
 * - Asw,min/s = ρsw,min × bw × sin(α)
 *
 * ## Maximum Stirrup Spacing (Item 18.3.3.2)
 * - If Vsd ≤ 0.67 × VRd2: s_max = 0.6d ≤ 30cm
 * - If Vsd > 0.67 × VRd2: s_max = 0.3d ≤ 20cm
 */

export interface ShearDesignParams {
  /** Web width (cm) */
  bw: number;
  /** Effective depth (cm) */
  d: number;
  /** Characteristic compressive strength (MPa) */
  fck: number;
  /** Mean tensile strength (MPa) */
  fctm: number;
  /** Characteristic tensile strength - inferior (MPa) */
  fctk_inf: number;
  /** Stirrup yield strength (MPa) */
  fywk: number;
  /** Design shear force (kN) */
  Vsd: number;
  /** Gamma c (default 1.4) */
  gamma_c?: number;
  /** Gamma s (default 1.15) */
  gamma_s?: number;
  /** Calculation model (1 or 2) */
  model?: 1 | 2;
  /** Strut angle θ in degrees (for Model II, default 45) */
  theta?: number;
  /** Stirrup inclination α in degrees (default 90 for vertical) */
  alpha?: number;
}

export interface ShearDesignResult {
  /** Input summary */
  inputs: {
    bw: number;
    d: number;
    fck: number;
    fywk: number;
    Vsd: number;
    model: number;
    theta: number;
    alpha: number;
  };
  /** Resistance values */
  resistance: {
    /** Design compressive strength (MPa) */
    fcd: number;
    /** Design tensile strength (MPa) */
    fctd: number;
    /** Design stirrup yield strength (MPa) - max 435 */
    fywd: number;
    /** Strength reduction factor αv2 */
    alpha_v2: number;
    /** Ultimate shear resistance (diagonal compression) (kN) */
    VRd2: number;
    /** Concrete contribution to shear (kN) */
    Vc: number;
    /** Steel contribution required (kN) */
    Vsw: number;
  };
  /** Stirrup requirements */
  stirrups: {
    /** Required Asw/s (cm²/m) */
    asw_s_required: number;
    /** Minimum Asw/s (cm²/m) */
    asw_s_min: number;
    /** Governing Asw/s (cm²/m) */
    asw_s: number;
    /** Maximum spacing (cm) */
    s_max: number;
    /** Minimum reinforcement ratio */
    rho_sw_min: number;
  };
  /** Suggested detailing */
  detailing: {
    diameter: number;
    legs: number;
    spacing: number;
    asw_s_provided: number;
  }[];
  /** Status */
  status: {
    isValid: boolean;
    utilizationRatio: number;
    messages: string[];
  };
}

/**
 * Calculate shear design for reinforced concrete beam
 */
export function calculateShearDesign(
  params: ShearDesignParams
): ShearDesignResult {
  const {
    bw,
    d,
    fck,
    fctm,
    fctk_inf,
    fywk,
    Vsd,
    gamma_c = 1.4,
    gamma_s = 1.15,
    model = 1,
    theta = 45,
    alpha = 90,
  } = params;

  const messages: string[] = [];

  // Convert angles to radians
  const thetaRad = (theta * Math.PI) / 180;
  const alphaRad = (alpha * Math.PI) / 180;

  // Design strengths (convert MPa to kN/cm²)
  const fcd = fck / gamma_c / 10; // kN/cm²
  const fctd = fctk_inf / gamma_c / 10; // kN/cm²

  // fywd limited to 435 MPa per NBR 6118 (item 17.4.2.2)
  const fywd_mpa = Math.min(fywk / gamma_s, 435);
  const fywd = fywd_mpa / 10; // kN/cm²

  if (fywk / gamma_s > 435) {
    messages.push("⚠️ fywd limitado a 435 MPa conforme NBR 6118");
  }

  // Strength reduction factor (item 17.4.2.2)
  const alpha_v2 = 1 - fck / 250;

  // Calculate VRd2 (diagonal compression limit)
  let VRd2: number;

  if (model === 1) {
    // Model I: θ = 45°
    VRd2 = 0.27 * alpha_v2 * fcd * bw * d;
  } else {
    // Model II: variable θ
    const sinTheta = Math.sin(thetaRad);
    const cotTheta = 1 / Math.tan(thetaRad);
    const cotAlpha = 1 / Math.tan(alphaRad);
    VRd2 =
      0.54 *
      alpha_v2 *
      fcd *
      bw *
      d *
      sinTheta *
      sinTheta *
      (cotTheta + cotAlpha);
  }

  // Check diagonal compression
  if (Vsd > VRd2) {
    messages.push("❌ Vsd > VRd2: Aumentar dimensões da seção ou fck");
  }

  // Calculate Vc (concrete contribution) - Model I
  // For simple flexure without axial force
  let Vc: number;

  if (model === 1) {
    // Vc = 0.6 × fctd × bw × d (flexão simples)
    Vc = 0.6 * fctd * bw * d;
  } else {
    // Model II: Vc = 0 (conservative) or varies with θ
    // Vc = Vc1 when θ = 45°, Vc = 0 when θ = 30°
    // Linear interpolation
    const Vc_45 = 0.6 * fctd * bw * d;
    const factor = (theta - 30) / 15; // 0 to 1 as θ goes from 30 to 45
    Vc = factor * Vc_45;
  }

  // Required steel contribution
  const Vsw = Math.max(Vsd - Vc, 0);

  // Calculate Asw/s required (cm²/m)
  let asw_s_required: number;

  if (model === 1) {
    // Asw/s = Vsw / (0.9 × d × fywd)
    asw_s_required = Vsw > 0 ? (Vsw / (0.9 * d * fywd)) * 100 : 0; // cm²/m
  } else {
    // Model II
    const cotTheta = 1 / Math.tan(thetaRad);
    const sinAlpha = Math.sin(alphaRad);
    const cotAlpha = 1 / Math.tan(alphaRad);
    asw_s_required =
      Vsw > 0
        ? (Vsw / (0.9 * d * fywd * (cotTheta + cotAlpha) * sinAlpha)) * 100
        : 0;
  }

  // Minimum stirrup reinforcement (item 17.4.1.1)
  const rho_sw_min = (0.2 * (fctm / 10)) / (fywk / 10); // dimensionless
  const asw_s_min = rho_sw_min * bw * Math.sin(alphaRad) * 100; // cm²/m

  // Governing Asw/s
  const asw_s = Math.max(asw_s_required, asw_s_min);

  if (asw_s_required < asw_s_min) {
    messages.push("ℹ️ Armadura mínima governa");
  }

  // Maximum spacing (item 18.3.3.2)
  const utilizationRatio = Vsd / VRd2;
  let s_max: number;

  if (utilizationRatio <= 0.67) {
    s_max = Math.min(0.6 * d, 30);
  } else {
    s_max = Math.min(0.3 * d, 20);
    messages.push("⚠️ Espaçamento reduzido (Vsd > 0.67 VRd2)");
  }

  // Suggest detailing options
  const detailing = suggestStirrupDetailing(asw_s, s_max, bw);

  // Final status
  const isValid = Vsd <= VRd2;

  if (isValid) {
    messages.push("✅ Verificação ao cisalhamento OK");
  }

  return {
    inputs: {
      bw,
      d,
      fck,
      fywk,
      Vsd,
      model,
      theta,
      alpha,
    },
    resistance: {
      fcd: fcd * 10, // back to MPa for display
      fctd: fctd * 10,
      fywd: fywd_mpa,
      alpha_v2,
      VRd2,
      Vc,
      Vsw,
    },
    stirrups: {
      asw_s_required,
      asw_s_min,
      asw_s,
      s_max,
      rho_sw_min,
    },
    detailing,
    status: {
      isValid,
      utilizationRatio,
      messages,
    },
  };
}

/**
 * Suggest practical stirrup arrangements
 */
function suggestStirrupDetailing(
  asw_s: number,
  s_max: number,
  bw: number
): ShearDesignResult["detailing"] {
  const suggestions: ShearDesignResult["detailing"] = [];

  // Common stirrup diameters (mm)
  const diameters = [5.0, 6.3, 8.0, 10.0];

  // Number of legs based on beam width
  const legsOptions = bw <= 25 ? [2] : bw <= 40 ? [2, 4] : [2, 4, 6];

  for (const diameter of diameters) {
    const areaPerLeg = (Math.PI * diameter * diameter) / 400; // cm²

    for (const legs of legsOptions) {
      const areaTotal = areaPerLeg * legs;

      // Calculate required spacing
      const spacing = (areaTotal / asw_s) * 100; // cm

      // Round down to practical value
      const practicalSpacing = Math.min(
        Math.floor(spacing / 2.5) * 2.5, // round to 2.5cm
        s_max
      );

      if (practicalSpacing >= 5 && practicalSpacing <= s_max) {
        const asw_s_provided = (areaTotal / practicalSpacing) * 100;

        // Only add if it provides enough reinforcement
        if (asw_s_provided >= asw_s * 0.95) {
          suggestions.push({
            diameter,
            legs,
            spacing: practicalSpacing,
            asw_s_provided,
          });
        }
      }
    }
  }

  // Sort by efficiency (closest to required without waste)
  suggestions.sort((a, b) => a.asw_s_provided - b.asw_s_provided);

  // Return top 3
  return suggestions.slice(0, 3);
}

/**
 * Calculate stirrup area for given diameter and legs
 */
export function stirrupArea(diameter_mm: number, legs: number = 2): number {
  return ((Math.PI * Math.pow(diameter_mm, 2)) / 400) * legs;
}

/**
 * Calculate Asw/s provided for given stirrup configuration
 */
export function aswsProvided(
  diameter_mm: number,
  legs: number,
  spacing_cm: number
): number {
  const area = stirrupArea(diameter_mm, legs);
  return (area / spacing_cm) * 100; // cm²/m
}
