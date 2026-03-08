/**
 * Deflection Verification Core Logic - NBR 6118:2023
 *
 * Calculates beam deflections for Serviceability Limit State (ELS).
 *
 * ## Method (Section 17.3)
 *
 * ### Cracking Moment (Mcr)
 * - Mcr = (αct × fctm × Ic) / yt
 * - αct = 1.5 for rectangular sections
 *
 * ### Effective Moment of Inertia (Branson)
 * - If Ma < Mcr: Ie = Ic (uncracked)
 * - If Ma ≥ Mcr: Ie = (Mcr/Ma)³ × Ic + [1 - (Mcr/Ma)³] × III
 *
 * Where:
 * - Ic = gross moment of inertia
 * - III = cracked moment of inertia
 * - Ma = service moment (ELS)
 *
 * ### Immediate Deflection
 * - Simple beam: δ = 5 × q × L⁴ / (384 × Ecs × Ie)
 * - Cantilever: δ = q × L⁴ / (8 × Ecs × Ie)
 *
 * ### Time-Dependent Deflection (Creep)
 * - αf = Δξ / (1 + 50ρ')
 * - Δξ depends on loading duration (Table 17.1)
 * - δ_total = δ_immediate × (1 + αf)
 *
 * ## Acceptance Criteria (Table 13.3)
 * - Visual: L/250
 * - Damage to rigid elements: L/350 or L/500
 * - Vibration: L/350
 */

export interface DeflectionParams {
  /** Span length (cm) */
  span: number;
  /** Gross moment of inertia (cm⁴) */
  Ic: number;
  /** Cracked moment of inertia (cm⁴) */
  III?: number;
  /** Section height (cm) */
  h: number;
  /** Section width (cm) */
  b: number;
  /** Effective depth (cm) */
  d: number;
  /** Distance to centroid from bottom (cm) */
  yt: number;
  /** Secant modulus of concrete (GPa) */
  Ecs: number;
  /** Mean tensile strength (MPa) */
  fctm: number;
  /** Service moment - quasi-permanent (kN.cm) */
  Ma: number;
  /** Compression reinforcement ratio ρ' */
  rho_prime?: number;
  /** Modular ratio Es/Ec */
  alpha_e?: number;
  /** Tension steel area (cm²) */
  As?: number;
  /** Beam type */
  beamType?: "simple" | "cantilever" | "continuous";
  /** Loading duration (months). Default: 60 (5 years) */
  loadingDuration?: number;
  /** Quasi-permanent service moment (kN.cm). If provided, used for creep deflection.
   *  NBR 6118:2023 Item 17.3.2.1: δ_total = δ_imediata(Ma) + αf × δ_imediata(Ma_qp)
   *  If omitted, uses Ma for both (conservative simplification). */
  Ma_quasiPermanent?: number;
}

export interface DeflectionResult {
  /** Input summary */
  inputs: {
    span: number;
    h: number;
    Ecs: number;
    Ma: number;
    beamType: string;
  };
  /** Cracking analysis */
  cracking: {
    /** Cracking moment (kN.cm) */
    Mcr: number;
    /** Is section cracked? */
    isCracked: boolean;
    /** Cracking ratio Ma/Mcr */
    crackingRatio: number;
  };
  /** Moment of inertia */
  inertia: {
    /** Gross inertia (cm⁴) */
    Ic: number;
    /** Cracked inertia (cm⁴) - estimated if not provided */
    III: number;
    /** Effective inertia (cm⁴) */
    Ie: number;
  };
  /** Deflections */
  deflection: {
    /** Immediate deflection (cm) */
    immediate: number;
    /** Creep factor αf */
    alpha_f: number;
    /** Time-dependent deflection (cm) */
    creep: number;
    /** Total deflection (cm) */
    total: number;
  };
  /** Limit checks */
  limits: {
    /** L/250 limit (cm) */
    visual: number;
    /** L/350 limit (cm) */
    damageSensitive: number;
    /** L/500 limit (cm) */
    damageVeryRigid: number;
  };
  /** Status */
  status: {
    passesVisual: boolean;
    passesDamageSensitive: boolean;
    utilizationRatio: number;
    messages: string[];
  };
}

/**
 * Calculate cracked moment of inertia (approximation)
 * III ≈ 0.35 × Ic for rectangular sections (conservative estimate)
 */
function estimateCrackedInertia(
  Ic: number,
  b: number,
  d: number,
  As?: number,
  alpha_e?: number,
): number {
  if (As && alpha_e) {
    // More accurate calculation
    // x = (α_e × As / b) × [-1 + √(1 + 2×b×d/(α_e×As))]
    const ratio = (alpha_e * As) / b;
    const x = ratio * (-1 + Math.sqrt(1 + (2 * b * d) / (alpha_e * As)));
    return (b * Math.pow(x, 3)) / 3 + alpha_e * As * Math.pow(d - x, 2);
  }

  // Conservative approximation
  return 0.35 * Ic;
}

/**
 * Calculate creep multiplier Δξ from loading duration
 * Based on NBR 6118:2023 Table 17.1
 *
 * Table 17.1 - Values of Δξ for calculating αf
 * ┌──────────────────┬───────┐
 * │ Duration (months)│  Δξ   │
 * ├──────────────────┼───────┤
 * │       0.5        │  0.68 │
 * │       1          │  0.84 │
 * │       2          │  0.96 │
 * │       3          │  1.04 │
 * │       4          │  1.08 │
 * │       6          │  1.16 │
 * │      12          │  1.32 │
 * │      18          │  1.40 │
 * │      24          │  1.44 │
 * │      60          │  1.68 │
 * │     ≥ 70 (∞)     │  2.00 │
 * └──────────────────┴───────┘
 */
export function getCreepCoefficient(durationMonths: number): number {
  // Tabulated values [duration_months, delta_xi]
  const table: [number, number][] = [
    [0, 0],
    [0.5, 0.68],
    [1, 0.84],
    [2, 0.96],
    [3, 1.04],
    [4, 1.08],
    [6, 1.16],
    [12, 1.32],
    [18, 1.4],
    [24, 1.44],
    [60, 1.68],
    [70, 2.0],
  ];

  // Clamp to table range
  if (durationMonths <= 0) return 0;
  if (durationMonths >= 70) return 2.0;

  // Linear interpolation between tabulated points
  for (let i = 1; i < table.length; i++) {
    if (durationMonths <= table[i][0]) {
      const [t0, v0] = table[i - 1];
      const [t1, v1] = table[i];
      const ratio = (durationMonths - t0) / (t1 - t0);
      return v0 + ratio * (v1 - v0);
    }
  }

  return 2.0; // Fallback for > 70 months
}

/**
 * Calculate beam deflection for ELS verification
 */
export function calculateDeflection(
  params: DeflectionParams,
): DeflectionResult {
  const {
    span,
    Ic,
    III: providedIII,
    h,
    b,
    d,
    yt,
    Ecs,
    fctm,
    Ma,
    rho_prime = 0,
    alpha_e = 15, // Es/Ec typical value
    As,
    beamType = "simple",
    loadingDuration = 60, // 5 years default
  } = params;

  const messages: string[] = [];

  // Convert Ecs from GPa to kN/cm²
  const Ecs_kN_cm2 = Ecs * 100; // GPa to kN/cm²

  // Calculate cracking moment
  // Mcr = (αct × fctm × Ic) / yt
  const alpha_ct = 1.5; // for rectangular sections
  const fctm_kN_cm2 = fctm / 10; // MPa to kN/cm²
  const Mcr = (alpha_ct * fctm_kN_cm2 * Ic) / yt;

  // Check if cracked
  const isCracked = Ma >= Mcr;
  const crackingRatio = Ma / Mcr;

  // Estimate cracked inertia if not provided
  const III = providedIII ?? estimateCrackedInertia(Ic, b, d, As, alpha_e);

  // Calculate effective moment of inertia (Branson)
  let Ie: number;

  if (!isCracked) {
    Ie = Ic;
    messages.push("ℹ️ Seção não fissurada (Ma < Mcr)");
  } else {
    const ratio = Mcr / Ma;
    const ratio3 = Math.pow(ratio, 3);
    Ie = ratio3 * Ic + (1 - ratio3) * III;

    // Branson limits
    Ie = Math.max(Ie, III);
    Ie = Math.min(Ie, Ic);

    messages.push("⚠️ Seção fissurada - usando inércia equivalente");
  }

  // Calculate immediate deflection
  let immediate: number;

  switch (beamType) {
    case "simple":
      // δ = 5 × q × L⁴ / (384 × E × I)
      // For moment input: δ = M × L² / (C × E × I)
      // C = 8 for uniform load on simple beam
      immediate = (5 * Ma * Math.pow(span, 2)) / (48 * Ecs_kN_cm2 * Ie);
      break;
    case "cantilever":
      immediate = (Ma * Math.pow(span, 2)) / (2 * Ecs_kN_cm2 * Ie);
      break;
    case "continuous":
      // Approximate for continuous beam (0.7 of simple beam)
      immediate = (0.7 * (5 * Ma * Math.pow(span, 2))) / (48 * Ecs_kN_cm2 * Ie);
      break;
    default:
      immediate = (5 * Ma * Math.pow(span, 2)) / (48 * Ecs_kN_cm2 * Ie);
  }

  // Calculate creep (time-dependent) factor
  const deltaXi = getCreepCoefficient(loadingDuration);
  const alpha_f = deltaXi / (1 + 50 * rho_prime);

  // NBR 6118:2023 Item 17.3.2.1 — Precise creep deflection
  // δ_total = δ_imediata(p_total) + αf × δ_imediata(p_quase_permanente)
  let creep: number;
  if (
    params.Ma_quasiPermanent !== undefined &&
    params.Ma_quasiPermanent !== Ma
  ) {
    const Ma_qp = params.Ma_quasiPermanent;
    // Recalculate effective inertia for quasi-permanent moment
    let Ie_qp: number;
    if (Ma_qp < Mcr) {
      Ie_qp = Ic; // not cracked under quasi-permanent load
    } else {
      const ratio_qp = Mcr / Ma_qp;
      const ratio3_qp = Math.pow(ratio_qp, 3);
      Ie_qp = ratio3_qp * Ic + (1 - ratio3_qp) * III;
      Ie_qp = Math.max(Ie_qp, III);
      Ie_qp = Math.min(Ie_qp, Ic);
    }
    // Immediate deflection under quasi-permanent load
    let immediate_qp: number;
    switch (beamType) {
      case "simple":
        immediate_qp =
          (5 * Ma_qp * Math.pow(span, 2)) / (48 * Ecs_kN_cm2 * Ie_qp);
        break;
      case "cantilever":
        immediate_qp = (Ma_qp * Math.pow(span, 2)) / (2 * Ecs_kN_cm2 * Ie_qp);
        break;
      case "continuous":
        immediate_qp =
          (0.7 * (5 * Ma_qp * Math.pow(span, 2))) / (48 * Ecs_kN_cm2 * Ie_qp);
        break;
      default:
        immediate_qp =
          (5 * Ma_qp * Math.pow(span, 2)) / (48 * Ecs_kN_cm2 * Ie_qp);
    }
    creep = immediate_qp * alpha_f;
    messages.push(
      "ℹ️ Flecha diferida calculada com carga quase-permanente separada",
    );
  } else {
    // Simplified: assume all load is quasi-permanent
    creep = immediate * alpha_f;
  }

  // Total deflection
  const total = immediate + creep;

  // Acceptance limits
  const visual = span / 250;
  const damageSensitive = span / 350;
  const damageVeryRigid = span / 500;

  // Status checks
  const passesVisual = total <= visual;
  const passesDamageSensitive = total <= damageSensitive;
  const utilizationRatio = total / visual;

  if (passesVisual) {
    messages.push("✅ Flecha atende L/250 (aceitabilidade visual)");
  } else {
    messages.push("❌ Flecha excede L/250");
  }

  if (!passesDamageSensitive) {
    messages.push("⚠️ Flecha pode causar danos a elementos rígidos");
  }

  return {
    inputs: {
      span,
      h,
      Ecs,
      Ma,
      beamType,
    },
    cracking: {
      Mcr,
      isCracked,
      crackingRatio,
    },
    inertia: {
      Ic,
      III,
      Ie,
    },
    deflection: {
      immediate,
      alpha_f,
      creep,
      total,
    },
    limits: {
      visual,
      damageSensitive,
      damageVeryRigid,
    },
    status: {
      passesVisual,
      passesDamageSensitive,
      utilizationRatio,
      messages,
    },
  };
}
