/**
 * Torsion Design Core Logic - NBR 6118:2023
 *
 * Calculates torsion reinforcement for beams per Section 17.5.
 *
 * ## Torsion Resistance (TRd2) - Item 17.5.1.4
 * - TRd2 = 0.5 × αv2 × fcd × Ae × he
 *
 * ## Equivalent Parameters
 * - he = A / u (equivalent wall thickness)
 * - Ae = (b - he) × (h - he) (enclosed area)
 *
 * ## Reinforcement - Item 17.5.1.5
 * - Asl = Tsd / (2 × Ae × fyd) (longitudinal)
 * - Ast/s = Tsd / (2 × Ae × fywd) (transverse)
 *
 * ## Torsion-Shear Interaction - Item 17.5.1.6
 * - (Tsd/TRd2) + (Vsd/VRd2) ≤ 1
 */

export interface TorsionDesignParams {
  /** Section width (cm) */
  b: number;
  /** Section height (cm) */
  h: number;
  /** Effective depth (cm) */
  d: number;
  /** Design torsion moment (kN.cm) */
  Tsd: number;
  /** Design shear force for interaction (kN) */
  Vsd?: number;
  /** VRd2 from shear calculation (kN) */
  VRd2?: number;
  /** Characteristic compressive strength (MPa) */
  fck: number;
  /** Steel yield strength - longitudinal (MPa) */
  fyk: number;
  /** Steel yield strength - transverse (MPa) */
  fywk?: number;
  /** Strut inclination angle (degrees), 30° ≤ θ ≤ 45°. Default: 45° */
  theta?: number;
}

export interface TorsionDesignResult {
  /** Input summary */
  inputs: {
    b: number;
    h: number;
    Tsd: number;
    Vsd?: number;
  };
  /** Section parameters */
  section: {
    /** Gross area (cm²) */
    A: number;
    /** Perimeter (cm) */
    u: number;
    /** Equivalent wall thickness (cm) */
    he: number;
    /** Enclosed area (cm²) */
    Ae: number;
  };
  /** Resistance values */
  resistance: {
    /** αv2 factor */
    alpha_v2: number;
    /** fcd (MPa) */
    fcd: number;
    /** Torsion resistance limit (kN.cm) */
    TRd2: number;
  };
  /** Reinforcement */
  reinforcement: {
    /** Longitudinal steel area (cm²) */
    Asl: number;
    /** Transverse steel per meter (cm²/m) */
    Ast_s: number;
    /** Minimum longitudinal (cm²) */
    Asl_min: number;
    /** Minimum transverse (cm²/m) */
    Ast_s_min: number;
    /** Governing longitudinal (cm²) */
    Asl_gov: number;
    /** Governing transverse (cm²/m) */
    Ast_s_gov: number;
  };
  /** Interaction check (if Vsd provided) */
  interaction?: {
    /** Tsd/TRd2 ratio */
    torsionRatio: number;
    /** Vsd/VRd2 ratio */
    shearRatio: number;
    /** Combined ratio (must be ≤ 1) */
    combinedRatio: number;
    isValid: boolean;
  };
  /** Status */
  status: {
    isValid: boolean;
    utilizationRatio: number;
    messages: string[];
  };
}

/**
 * Calculate torsion design
 */
export function calculateTorsionDesign(
  params: TorsionDesignParams,
): TorsionDesignResult {
  const {
    b,
    h,
    d: _d, // Not used directly in torsion (uses he), kept for interface compatibility
    Tsd,
    Vsd,
    VRd2,
    fck,
    fyk,
    fywk = fyk,
    theta = 45,
  } = params;

  const messages: string[] = [];

  // Validate θ range (NBR 6118:2023 Item 17.5.1.5)
  const thetaClamped = Math.max(30, Math.min(45, theta));
  const thetaRad = (thetaClamped * Math.PI) / 180;
  const cotTheta = 1 / Math.tan(thetaRad);

  if (theta !== thetaClamped) {
    messages.push(`⚠️ θ ajustado para ${thetaClamped}° (faixa: 30° a 45°)`);
  }
  if (thetaClamped < 45) {
    messages.push(`ℹ️ Modelo com θ = ${thetaClamped}° (otimizado)`);
  }

  // Design strengths
  const fcd = fck / 1.4 / 10; // kN/cm²
  const fyd = fyk / 1.15 / 10; // kN/cm²
  const fywd = Math.min(fywk / 1.15, 435) / 10; // kN/cm², limited to 435 MPa

  // Section parameters
  const A = b * h;
  const u = 2 * (b + h);

  // Equivalent wall thickness (limited to actual size)
  const he = Math.min(A / u, b / 2, h / 2);

  // Enclosed area (area inside centerline of equivalent wall)
  const Ae = (b - he) * (h - he);

  // αv2 factor
  const alpha_v2 = 1 - fck / 250;

  // Torsion resistance limit (TRd2)
  // TRd2 = 0.5 × αv2 × fcd × Ae × he
  const TRd2 = 0.5 * alpha_v2 * fcd * Ae * he;

  // Check if section can resist torsion
  const utilizationRatio = Math.abs(Tsd) / TRd2;

  if (utilizationRatio > 1) {
    messages.push("❌ Tsd > TRd2: Aumentar dimensões da seção");
  }

  // Reinforcement calculation (NBR 6118:2023 Item 17.5.1.5)
  // With variable θ:
  //   Asl = Tsd × cotθ / (2 × Ae × fyd) - distributed around perimeter
  //   Ast/s = Tsd / (2 × Ae × fywd × cotθ)
  const Asl = (Math.abs(Tsd) * cotTheta) / (2 * Ae * fyd);
  const Ast_s = (Math.abs(Tsd) / (2 * Ae * fywd * cotTheta)) * 100; // cm²/m

  // Minimum reinforcement
  // fctm per NBR 6118:2023 Item 8.2.5 (valid for all fck ranges)
  const fctm =
    fck <= 50
      ? 0.3 * Math.pow(fck, 2 / 3) // fck ≤ 50 MPa
      : 2.12 * Math.log(1 + 0.11 * fck); // fck > 50 MPa
  const rho_sw_min = (0.2 * (fctm / 10)) / (fywk / 10);
  const Ast_s_min = rho_sw_min * b * 100; // cm²/m

  // Minimum longitudinal: 0.15% of section
  const Asl_min = 0.0015 * A;

  // Governing values
  const Asl_gov = Math.max(Asl, Asl_min);
  const Ast_s_gov = Math.max(Ast_s, Ast_s_min);

  // Interaction check
  let interaction: TorsionDesignResult["interaction"];

  if (Vsd !== undefined && VRd2 !== undefined && VRd2 > 0) {
    const torsionRatio = Math.abs(Tsd) / TRd2;
    const shearRatio = Math.abs(Vsd) / VRd2;
    const combinedRatio = torsionRatio + shearRatio;

    interaction = {
      torsionRatio,
      shearRatio,
      combinedRatio,
      isValid: combinedRatio <= 1,
    };

    if (!interaction.isValid) {
      messages.push(
        `❌ Interação torção-cisalhamento: ${(combinedRatio * 100).toFixed(
          0,
        )}% > 100%`,
      );
    } else {
      messages.push(
        `✅ Interação torção-cisalhamento: ${(combinedRatio * 100).toFixed(
          0,
        )}% ≤ 100%`,
      );
    }
  }

  // Status
  const isValid = utilizationRatio <= 1 && (interaction?.isValid ?? true);

  if (isValid && !interaction) {
    messages.push("✅ Verificação à torção pura OK");
  }

  messages.push(`ℹ️ Asl = ${Asl_gov.toFixed(2)} cm² (distribuir no perímetro)`);
  messages.push(
    `ℹ️ Ast/s = ${Ast_s_gov.toFixed(2)} cm²/m (adicionar aos estribos)`,
  );

  return {
    inputs: {
      b,
      h,
      Tsd,
      Vsd,
    },
    section: {
      A,
      u,
      he,
      Ae,
    },
    resistance: {
      alpha_v2,
      fcd: fcd * 10, // back to MPa
      TRd2,
    },
    reinforcement: {
      Asl,
      Ast_s,
      Asl_min,
      Ast_s_min,
      Asl_gov,
      Ast_s_gov,
    },
    interaction,
    status: {
      isValid,
      utilizationRatio,
      messages,
    },
  };
}
