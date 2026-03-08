/**
 * Punching Shear Verification - NBR 6118:2023
 *
 * Verifies punching shear resistance for flat slabs per Section 19.
 *
 * ## Critical Perimeters - Item 19.3
 * - C: at column face
 * - C': at distance 2d from column face
 *
 * ## Punching Stress (τsd) - Item 19.5.2
 * - τsd = Fsd / (u × d)
 *
 * ## Resistance without Reinforcement (τRd1) - Item 19.5.3.1
 * - τRd1 = 0.13 × (1 + √(20/d)) × ∛(100 × ρ × fck)
 *
 * ## Diagonal Compression Limit (τRd2) - Item 19.5.3.2
 * - τRd2 = 0.27 × αv2 × fcd
 *
 * ## Pillar Types
 * - Internal: u = 2(a+b) + 4πd
 * - Edge: u = a + 2b + πd
 * - Corner: u = a + b + πd/2
 */

export interface PunchingParams {
  /** Slab effective depth in x (cm) */
  dx: number;
  /** Slab effective depth in y (cm) */
  dy: number;
  /** Pillar dimension a (cm) - parallel to free edge for edge/corner */
  a: number;
  /** Pillar dimension b (cm) */
  b: number;
  /** Pillar position */
  pillarType: "internal" | "edge" | "corner";
  /** Design punching force (kN) */
  Fsd: number;
  /** Moment transfer factor β (default: from pillar type) */
  beta?: number;
  /** Reinforcement ratio in x */
  rho_x: number;
  /** Reinforcement ratio in y */
  rho_y: number;
  /** Characteristic compressive strength (MPa) */
  fck: number;
  /** Steel yield strength for punching reinforcement (MPa) */
  fywk?: number;
  /** Distance from pillar face to free edge in direction a (cm) - for edge/corner */
  c1?: number;
  /** Distance from pillar face to free edge in direction b (cm) - for corner */
  c2?: number;
}

export interface PunchingResult {
  /** Input summary */
  inputs: {
    dx: number;
    dy: number;
    a: number;
    b: number;
    pillarType: string;
    Fsd: number;
  };
  /** Critical perimeter */
  perimeter: {
    /** Average effective depth (cm) */
    d: number;
    /** Critical perimeter at 2d (cm) */
    u: number;
    /** Perimeter description */
    description: string;
  };
  /** Stress values */
  stress: {
    /** Acting punching stress (MPa) */
    tau_sd: number;
    /** Resistance without reinforcement (MPa) */
    tau_Rd1: number;
    /** Diagonal compression limit (MPa) */
    tau_Rd2: number;
    /** Effective reinforcement ratio */
    rho: number;
  };
  /** Verification result */
  verification: {
    /** Needs punching reinforcement */
    needsReinforcement: boolean;
    /** Section is adequate (τsd ≤ τRd2) */
    sectionAdequate: boolean;
    /** Utilization ratio */
    utilizationRatio: number;
  };
  /** Punching reinforcement (if needed) */
  reinforcement?: {
    /** Required shear reinforcement area (cm²) */
    Asw: number;
    /** Number of studs/stirrups suggested */
    nStuds: number;
    /** Stud diameter suggested (mm) */
    studDiameter: number;
  };
  /** Status */
  status: {
    isValid: boolean;
    messages: string[];
  };
}

/**
 * Calculate critical perimeter at 2d from column face
 */
function calculateCriticalPerimeter(
  a: number,
  b: number,
  d: number,
  pillarType: PunchingParams["pillarType"],
  c1?: number,
  c2?: number,
): { u: number; description: string } {
  let u: number;
  let description: string;

  switch (pillarType) {
    case "internal":
      // u = 2(a+b) + 4πd (full perimeter at 2d)
      u = 2 * (a + b) + 4 * Math.PI * d;
      description = "Pilar interno: u = 2(a+b) + 4πd";
      break;
    case "edge": {
      // NBR 6118:2023 Item 19.3.2
      // Edge pillar: one side is at free edge
      // The critical perimeter is limited by the free edge
      // c1 = distance from pillar face to free edge (default: flush = 0)
      const c1_eff = Math.min(c1 ?? 0, 2 * d); // Effective distance, capped at 2d

      if (c1_eff <= 0) {
        // Pillar flush with edge: u = a + 2b + 2πd
        u = a + 2 * b + 2 * Math.PI * d;
        description = "Pilar de borda (rente): u = a + 2b + 2πd";
      } else {
        // Pillar set back from edge
        // Two straight segments of length (b + 2d) each, plus a semicircle
        // and limited straight segment min(a/2 + 2d, a/2 + c1)
        const arm_a = Math.min(a / 2 + 2 * d, a / 2 + c1_eff);
        u = 2 * arm_a + 2 * (b + 2 * d) + Math.PI * d;
        description = `Pilar de borda (c1=${c1_eff.toFixed(1)}cm): u = 2×min(a/2+2d, a/2+c1) + 2(b+2d) + πd`;
      }
      break;
    }
    case "corner": {
      // NBR 6118:2023 Item 19.3.3
      // Corner pillar: two sides at free edge
      const c1c = Math.min(c1 ?? 0, 2 * d);
      const c2c = Math.min(c2 ?? 0, 2 * d);

      if (c1c <= 0 && c2c <= 0) {
        // Pillar flush with both edges
        u = a / 2 + b / 2 + (Math.PI * d) / 2;
        description = "Pilar de canto (rente): u = a/2 + b/2 + πd/2";
      } else {
        // Pillar set back from edges
        const arm_a = Math.min(a / 2 + 2 * d, a / 2 + c1c);
        const arm_b = Math.min(b / 2 + 2 * d, b / 2 + c2c);
        u = arm_a + arm_b + (Math.PI * d) / 2;
        description = `Pilar de canto (c1=${c1c.toFixed(1)}, c2=${c2c.toFixed(1)}cm): u limitado por bordas`;
      }
      break;
    }
    default:
      u = 2 * (a + b) + 4 * Math.PI * d;
      description = "Pilar interno (padrão)";
  }

  return { u, description };
}

/**
 * Calculate punching shear verification
 */
export function verifyPunching(params: PunchingParams): PunchingResult {
  const {
    dx,
    dy,
    a,
    b,
    pillarType,
    Fsd,
    rho_x,
    rho_y,
    fck,
    fywk = 500,
  } = params;

  const messages: string[] = [];

  // Average effective depth
  const d = (dx + dy) / 2;

  // Critical perimeter at 2d (with edge distance corrections)
  const { u, description } = calculateCriticalPerimeter(
    a,
    b,
    d,
    pillarType,
    params.c1,
    params.c2,
  );

  // Effective reinforcement ratio (geometric mean, limited to 2%)
  const rho = Math.min(Math.sqrt(rho_x * rho_y), 0.02);

  // Moment transfer factor β (Table 19.1 - NBR 6118:2023)
  // Accounts for unbalanced moments at column-slab connection
  let beta: number;
  if (params.beta !== undefined) {
    beta = params.beta;
  } else {
    // Default values from NBR 6118:2023 Table 19.1
    switch (pillarType) {
      case "internal":
        beta = 1.15; // With typical unbalanced moments
        break;
      case "edge":
        beta = 1.4;
        break;
      case "corner":
        beta = 1.5;
        break;
      default:
        beta = 1.15;
    }
  }

  // Punching stress τsd = β × Fsd / (u × d)
  // Fsd in kN, u and d in cm → τsd in kN/cm² → multiply by 10 for MPa
  const tau_sd = ((beta * Fsd) / (u * d)) * 10; // MPa

  // Resistance without reinforcement (Item 19.5.3.1)
  // τRd1 = (0.18 / γc) × (1 + √(20/d)) × ∛(100 × ρ × fck)
  // Using explicit γc = 1.4 for traceability (0.18/1.4 ≈ 0.129)
  const gamma_c = 1.4;
  const k = Math.min(1 + Math.sqrt(20 / d), 2.0); // Limited to 2.0 per NBR 6118:2023
  const tau_Rd1 = (0.18 / gamma_c) * k * Math.cbrt(100 * rho * fck); // MPa

  // Diagonal compression limit (Item 19.5.3.2)
  // τRd2 = 0.27 × αv2 × fcd
  const alpha_v2 = 1 - fck / 250;
  const fcd = fck / 1.4;
  const tau_Rd2 = 0.27 * alpha_v2 * fcd; // MPa

  // Verification
  const needsReinforcement = tau_sd > tau_Rd1;
  const sectionAdequate = tau_sd <= tau_Rd2;
  const utilizationRatio = tau_sd / tau_Rd2;

  // Status
  let isValid = sectionAdequate;

  if (!sectionAdequate) {
    messages.push("❌ τsd > τRd2: Aumentar espessura da laje ou usar capitel");
    isValid = false;
  } else if (!needsReinforcement) {
    messages.push("✅ τsd ≤ τRd1: Dispensa armadura de punção");
  } else {
    messages.push("⚠️ τRd1 < τsd ≤ τRd2: Necessária armadura de punção");
  }

  // Calculate punching reinforcement if needed
  let reinforcement: PunchingResult["reinforcement"];

  if (needsReinforcement && sectionAdequate) {
    // Asw = (τsd - 0.5 × τRd1) × u × d / (1.5 × fywd × sin α)
    // Assuming vertical studs (sin α = 1)
    const fywd = Math.min(fywk / 1.15, 435); // MPa, limited to 435 MPa

    // Convert units: τ in MPa, u and d in cm
    // Asw in cm²
    const tau_diff = tau_sd - 0.5 * tau_Rd1;
    const Asw = (tau_diff * u * d) / (1.5 * (fywd / 10)); // fywd converted to kN/cm²

    // Suggest studs
    const studDiameter = 10; // mm
    const areaPerStud = (Math.PI * studDiameter * studDiameter) / 400; // cm²
    const nStuds = Math.ceil(Asw / areaPerStud);

    reinforcement = {
      Asw,
      nStuds,
      studDiameter,
    };

    messages.push(
      `ℹ️ Asw = ${Asw.toFixed(2)} cm² (${nStuds} studs φ${studDiameter})`,
    );
  }

  messages.push(`ℹ️ τsd = ${tau_sd.toFixed(2)} MPa`);
  messages.push(`ℹ️ τRd1 = ${tau_Rd1.toFixed(2)} MPa (sem armadura)`);
  messages.push(`ℹ️ τRd2 = ${tau_Rd2.toFixed(2)} MPa (limite)`);

  return {
    inputs: {
      dx,
      dy,
      a,
      b,
      pillarType,
      Fsd,
    },
    perimeter: {
      d,
      u,
      description,
    },
    stress: {
      tau_sd,
      tau_Rd1,
      tau_Rd2,
      rho,
    },
    verification: {
      needsReinforcement,
      sectionAdequate,
      utilizationRatio,
    },
    reinforcement,
    status: {
      isValid,
      messages,
    },
  };
}
