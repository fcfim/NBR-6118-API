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
  /** Reinforcement ratio in x */
  rho_x: number;
  /** Reinforcement ratio in y */
  rho_y: number;
  /** Characteristic compressive strength (MPa) */
  fck: number;
  /** Steel yield strength for punching reinforcement (MPa) */
  fywk?: number;
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
  pillarType: PunchingParams["pillarType"]
): { u: number; description: string } {
  let u: number;
  let description: string;

  switch (pillarType) {
    case "internal":
      // u = 2(a+b) + 4πd
      u = 2 * (a + b) + 4 * Math.PI * d;
      description = "Pilar interno: u = 2(a+b) + 4πd";
      break;
    case "edge":
      // u = a + 2b + πd (simplified for edge parallel to 'b')
      u = a + 2 * b + Math.PI * d;
      description = "Pilar de borda: u = a + 2b + πd";
      break;
    case "corner":
      // u = a + b + πd/2
      u = a + b + (Math.PI * d) / 2;
      description = "Pilar de canto: u = a + b + πd/2";
      break;
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

  // Critical perimeter at 2d
  const { u, description } = calculateCriticalPerimeter(a, b, d, pillarType);

  // Effective reinforcement ratio (geometric mean, limited to 2%)
  const rho = Math.min(Math.sqrt(rho_x * rho_y), 0.02);

  // Punching stress τsd = Fsd / (u × d)
  // Fsd in kN, u and d in cm → τsd in kN/cm² → multiply by 10 for MPa
  const tau_sd = (Fsd / (u * d)) * 10; // MPa

  // Resistance without reinforcement (Item 19.5.3.1)
  // τRd1 = 0.13 × (1 + √(20/d)) × ∛(100 × ρ × fck)
  // d in cm (use as is per NBR formula)
  const k = 1 + Math.sqrt(20 / d);
  const tau_Rd1 = 0.13 * k * Math.cbrt(100 * rho * fck); // MPa

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
      `ℹ️ Asw = ${Asw.toFixed(2)} cm² (${nStuds} studs φ${studDiameter})`
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
