/**
 * Slab Design Core Logic - NBR 6118:2023
 *
 * Calculates reinforcement for reinforced concrete slabs.
 *
 * ## Classification
 * - One-way: λ = Ly/Lx > 2
 * - Two-way: λ = Ly/Lx ≤ 2
 *
 * ## Moments (Bares/Marcus)
 * - Mx = μx × p × Lx²
 * - My = μy × p × Lx²
 *
 * ## Reinforcement
 * Same method as beams using rectangular stress block.
 */

import {
  getBaresCoefficients,
  determineSupportCase,
  getMinimumThickness,
  getMinimumReinforcementRatio,
  SupportCase,
  SlabCoefficients,
} from "@/data/slabs/bares-coefficients.data";

export interface SlabGeometry {
  /** Shorter span Lx (cm) */
  Lx: number;
  /** Longer span Ly (cm) */
  Ly: number;
  /** Thickness h (cm) */
  h: number;
}

export interface SlabSupports {
  top: "free" | "simply" | "fixed";
  bottom: "free" | "simply" | "fixed";
  left: "free" | "simply" | "fixed";
  right: "free" | "simply" | "fixed";
}

export interface SlabDesignParams {
  geometry: SlabGeometry;
  supports: SlabSupports;
  /** Dead load (kN/m²) */
  deadLoad: number;
  /** Live load (kN/m²) */
  liveLoad: number;
  /** Load factor (default 1.4) */
  gamma_f?: number;
  /** Characteristic compressive strength (MPa) */
  fck: number;
  /** Steel yield strength (MPa) */
  fyk: number;
  /** Concrete cover (cm) */
  cover: number;
  /** Slab type */
  slabType: "floor" | "roof" | "cantilever";
}

export interface SlabMoments {
  /** Positive moment X (kN.cm/cm) */
  Mx_pos: number;
  /** Positive moment Y (kN.cm/cm) */
  My_pos: number;
  /** Negative moment X (kN.cm/cm) */
  Mx_neg?: number;
  /** Negative moment Y (kN.cm/cm) */
  My_neg?: number;
}

export interface SlabReinforcement {
  /** Direction */
  direction: "x" | "y";
  /** Moment type */
  type: "positive" | "negative";
  /** Moment (kN.cm/cm) */
  moment: number;
  /** Effective depth (cm) */
  d: number;
  /** Required As per meter (cm²/m) */
  As: number;
  /** Minimum As per meter (cm²/m) */
  As_min: number;
  /** Governing As (cm²/m) */
  As_gov: number;
  /** Suggested diameter (mm) */
  diameter: number;
  /** Suggested spacing (cm) */
  spacing: number;
}

export interface SlabDesignResult {
  /** Input summary */
  inputs: {
    Lx: number;
    Ly: number;
    h: number;
    totalLoad: number;
  };
  /** Classification */
  classification: {
    lambda: number;
    type: "one-way" | "two-way";
    supportCase: number;
    supportDescription: string;
  };
  /** Bares coefficients */
  coefficients: SlabCoefficients;
  /** Moments */
  moments: SlabMoments;
  /** Reinforcement */
  reinforcement: SlabReinforcement[];
  /** Detailing summary */
  detailing: {
    x_bottom: string;
    y_bottom: string;
    x_top?: string;
    y_top?: string;
  };
  /** Status */
  status: {
    isValid: boolean;
    messages: string[];
  };
}

/**
 * Get support case description
 */
function getSupportDescription(supportCase: SupportCase): string {
  const descriptions: Record<SupportCase, string> = {
    1: "4 bordas apoiadas",
    2: "1 borda curta engastada",
    3: "1 borda longa engastada",
    4: "2 bordas curtas opostas engastadas",
    5: "2 bordas longas opostas engastadas",
    6: "2 bordas adjacentes engastadas",
    7: "2 bordas adjacentes (diagonal) engastadas",
    8: "3 bordas engastadas",
    9: "4 bordas engastadas",
  };
  return descriptions[supportCase];
}

/**
 * Calculate reinforcement for slab
 */
function calculateSlabReinforcement(
  moment: number,
  d: number,
  b: number, // width = 100cm for per-meter calculation
  h: number, // slab total thickness (cm) for spacing limits
  fck: number,
  fyk: number,
  minRatio: number,
  direction: "x" | "y",
  type: "positive" | "negative",
): SlabReinforcement {
  const fcd = fck / 1.4 / 10; // kN/cm²
  const fyd = fyk / 1.15 / 10; // kN/cm²

  // Dimensionless moment
  const mu = moment / (b * d * d * fcd);

  // Check domain limit
  // Calculate xi_lim from actual material properties
  // ξlim = εcu / (εcu + εyd) for fck ≤ 50
  const epsilon_cu_slab =
    fck <= 50 ? 0.0035 : 0.0026 + 0.035 * Math.pow((90 - fck) / 100, 4);
  const fyd_val = fyk / 1.15;
  const epsilon_yd_slab = fyd_val / 210000; // Es = 210 GPa
  const xi_lim = epsilon_cu_slab / (epsilon_cu_slab + epsilon_yd_slab);
  const lambda_sb = fck <= 50 ? 0.8 : 0.8 - (fck - 50) / 400;
  const mu_lim = lambda_sb * xi_lim * (1 - 0.5 * lambda_sb * xi_lim);

  let As: number;
  if (mu > mu_lim) {
    // Would need compression reinforcement
    As = ((mu / 0.8) * b * d * fcd) / fyd;
  } else {
    // Normal calculation
    const xi = 1 - Math.sqrt(1 - 2 * mu);
    As = (xi * b * d * fcd) / fyd;
  }

  // Ensure non-negative
  As = Math.max(0, As);

  // Minimum reinforcement
  const As_min = minRatio * b * d;

  // Governing
  const As_gov = Math.max(As, As_min);

  // Suggest detailing
  const { diameter, spacing } = suggestSlabDetailing(As_gov, h);

  return {
    direction,
    type,
    moment,
    d,
    As,
    As_min,
    As_gov,
    diameter,
    spacing,
  };
}

/**
 * Suggest practical slab detailing
 */
/**
 * Suggest practical slab detailing with NBR 6118:2023 spacing limits
 * Item 20.1: s_max_main = min(2h, 20cm), s_max_dist = 33cm
 */
function suggestSlabDetailing(
  As_per_meter: number,
  h: number,
  isDistribution: boolean = false,
): {
  diameter: number;
  spacing: number;
} {
  // NBR 6118:2023 Item 20.1 - Maximum spacing limits
  const s_max = isDistribution
    ? 33 // Distribution reinforcement: 33cm
    : Math.min(2 * h, 20); // Main reinforcement: min(2h, 20cm)

  // Common slab bar diameters
  const diameters = [6.3, 8.0, 10.0, 12.5];

  for (const diameter of diameters) {
    const areaPerBar = (Math.PI * diameter * diameter) / 400;
    const spacing = (areaPerBar / As_per_meter) * 100;

    // Round down to practical value
    const practicalSpacing = Math.floor(spacing / 2.5) * 2.5;

    // Check limits (5cm min, s_max for type)
    if (practicalSpacing >= 5 && practicalSpacing <= s_max) {
      return { diameter, spacing: practicalSpacing };
    }
  }

  // If no good option found, use larger diameter with minimum spacing
  const diameter = 12.5;
  const areaPerBar = (Math.PI * diameter * diameter) / 400;
  const spacing = Math.max(
    5,
    Math.min(s_max, (areaPerBar / As_per_meter) * 100),
  );

  return { diameter, spacing: Math.floor(spacing / 2.5) * 2.5 || 10 };
}

/**
 * Calculate slab design
 */
export function calculateSlabDesign(
  params: SlabDesignParams,
): SlabDesignResult {
  const {
    geometry,
    supports,
    deadLoad,
    liveLoad,
    gamma_f = 1.4,
    fck,
    fyk,
    cover,
    slabType,
  } = params;

  const messages: string[] = [];
  const { Lx, Ly, h } = geometry;

  // Check minimum thickness
  const h_min = getMinimumThickness(slabType);
  if (h < h_min) {
    messages.push(
      `⚠️ Espessura h=${h}cm menor que mínimo ${h_min}cm para ${slabType}`,
    );
  }

  // Calculate λ and classify
  const lambda = Ly / Lx;
  const isOneWay = lambda > 2;
  const type = isOneWay ? "one-way" : "two-way";

  // Total design load (kN/m²)
  const totalLoad = gamma_f * (deadLoad + liveLoad);
  // totalLoad is in kN/m², used by coefficient-based moment formulas

  // Determine support case
  const supportCase = determineSupportCase(
    supports.top,
    supports.bottom,
    supports.left,
    supports.right,
  );

  // Get coefficients
  let coefficients: SlabCoefficients;

  if (isOneWay) {
    // One-way slab: use beam formulas
    const isFixed = supports.left === "fixed" && supports.right === "fixed";
    const isOneFixed = supports.left === "fixed" || supports.right === "fixed";

    if (isFixed) {
      coefficients = { mx_pos: 1 / 24, my_pos: 0, mx_neg: 1 / 12 };
    } else if (isOneFixed) {
      coefficients = { mx_pos: 9 / 128, my_pos: 0, mx_neg: 1 / 8 };
    } else {
      coefficients = { mx_pos: 1 / 8, my_pos: 0 };
    }
    // NBR 6118:2023 Item 20.1: Distribution reinforcement for one-way slabs
    // Must be >= 20% of main reinforcement area or rho_min
    messages.push("ℹ️ Laje armada em uma direção (λ > 2)");
    messages.push(
      "ℹ️ Armadura de distribuição perpendicular ≥ 20% da principal (ou ρmin)",
    );
  } else {
    coefficients = getBaresCoefficients(lambda, supportCase);
    messages.push(`ℹ️ Laje armada em duas direções (λ = ${lambda.toFixed(2)})`);
  }

  // Calculate moments (kN.cm/cm = kN.m/m × 100 / 100)
  const Lx_m = Lx / 100;
  const Mx_pos = coefficients.mx_pos * totalLoad * Lx_m * Lx_m; // kN.m/m
  const My_pos = coefficients.my_pos * totalLoad * Lx_m * Lx_m;
  const Mx_neg = coefficients.mx_neg
    ? coefficients.mx_neg * totalLoad * Lx_m * Lx_m
    : undefined;
  const My_neg = coefficients.my_neg
    ? coefficients.my_neg * totalLoad * Lx_m * Lx_m
    : undefined;

  // Convert to kN.cm per cm of width for reinforcement calculation
  const Mx_pos_kNcm = Mx_pos * 100; // kN.m/m → kN.cm/cm
  const My_pos_kNcm = My_pos * 100;
  const Mx_neg_kNcm = Mx_neg ? Mx_neg * 100 : undefined;
  const My_neg_kNcm = My_neg ? My_neg * 100 : undefined;

  const moments: SlabMoments = {
    Mx_pos,
    My_pos,
    Mx_neg,
    My_neg,
  };

  // Effective depths
  const mainDia = 8; // assumed initial
  const dx = h - cover - mainDia / 20; // bottom layer X
  const dy = h - cover - mainDia / 10 - mainDia / 20; // top layer Y

  // Minimum reinforcement ratio
  const minRatio = getMinimumReinforcementRatio(fck);

  // Calculate reinforcement
  const reinforcement: SlabReinforcement[] = [];

  // Positive X (bottom)
  if (Mx_pos > 0) {
    reinforcement.push(
      calculateSlabReinforcement(
        Mx_pos_kNcm,
        dx,
        100,
        h,
        fck,
        fyk,
        minRatio,
        "x",
        "positive",
      ),
    );
  }

  // Positive Y (bottom)
  if (My_pos > 0) {
    reinforcement.push(
      calculateSlabReinforcement(
        My_pos_kNcm,
        dy,
        100,
        h,
        fck,
        fyk,
        minRatio,
        "y",
        "positive",
      ),
    );
  } else if (isOneWay) {
    // NBR 6118:2023 Item 20.1 — Distribution reinforcement for one-way slabs
    // As_dist ≥ max(20% of main reinforcement, ρmin × b × d)
    const xPosReinf = reinforcement.find(
      (r) => r.direction === "x" && r.type === "positive",
    );
    const As_main = xPosReinf?.As_gov ?? 0;
    const As_dist_from_main = 0.2 * As_main;
    const As_dist_from_min = minRatio * 100 * dy;
    const As_dist = Math.max(As_dist_from_main, As_dist_from_min);
    const detailingDist = suggestSlabDetailing(As_dist, h, true);
    reinforcement.push({
      direction: "y",
      type: "positive",
      moment: 0,
      d: dy,
      As: As_dist,
      As_min: As_dist_from_min,
      As_gov: As_dist,
      diameter: detailingDist.diameter,
      spacing: detailingDist.spacing,
    });
    messages.push(
      `ℹ️ Armadura de distribuição Y: ${As_dist.toFixed(2)} cm²/m (≥ 20% da principal)`,
    );
  }

  // Negative X (top)
  if (Mx_neg_kNcm && Mx_neg_kNcm > 0) {
    reinforcement.push(
      calculateSlabReinforcement(
        Mx_neg_kNcm,
        dx,
        100,
        h,
        fck,
        fyk,
        minRatio,
        "x",
        "negative",
      ),
    );
  }

  // Negative Y (top)
  if (My_neg_kNcm && My_neg_kNcm > 0) {
    reinforcement.push(
      calculateSlabReinforcement(
        My_neg_kNcm,
        dy,
        100,
        h,
        fck,
        fyk,
        minRatio,
        "y",
        "negative",
      ),
    );
  }

  // Build detailing summary
  const xPos = reinforcement.find(
    (r) => r.direction === "x" && r.type === "positive",
  );
  const yPos = reinforcement.find(
    (r) => r.direction === "y" && r.type === "positive",
  );
  const xNeg = reinforcement.find(
    (r) => r.direction === "x" && r.type === "negative",
  );
  const yNeg = reinforcement.find(
    (r) => r.direction === "y" && r.type === "negative",
  );

  const detailing = {
    x_bottom: xPos ? `φ${xPos.diameter} c/${xPos.spacing}` : "N/A",
    y_bottom: yPos ? `φ${yPos.diameter} c/${yPos.spacing}` : "N/A",
    x_top: xNeg ? `φ${xNeg.diameter} c/${xNeg.spacing}` : undefined,
    y_top: yNeg ? `φ${yNeg.diameter} c/${yNeg.spacing}` : undefined,
  };

  messages.push(
    `ℹ️ Caso ${supportCase}: ${getSupportDescription(supportCase)}`,
  );
  messages.push(`✅ Armadura calculada`);

  return {
    inputs: {
      Lx,
      Ly,
      h,
      totalLoad,
    },
    classification: {
      lambda,
      type,
      supportCase,
      supportDescription: getSupportDescription(supportCase),
    },
    coefficients,
    moments,
    reinforcement,
    detailing,
    status: {
      isValid: true,
      messages,
    },
  };
}
