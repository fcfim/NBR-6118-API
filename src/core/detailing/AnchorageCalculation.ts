/**
 * Anchorage and Splice Calculations - NBR 6118:2023
 *
 * Calculates anchorage lengths and splice requirements per Section 9.
 *
 * ## Basic Anchorage Length (lb) - Item 9.4.2.4
 * - lb = (φ/4) × (fyd/fbd)
 *
 * ## Design Bond Strength (fbd) - Item 9.3.2.1
 * - fbd = η1 × η2 × η3 × fctd
 * - η1: bar surface (1.0 smooth, 1.4 notched, 2.25 ribbed)
 * - η2: bond zone (1.0 good, 0.7 poor)
 * - η3: bar diameter effect
 *
 * ## Required Anchorage Length (lb,nec) - Item 9.4.2.5
 * - lb,nec = α × lb × (As,calc / As,ef) ≥ lb,min
 * - α: 1.0 (straight), 0.7 (hook)
 * - lb,min = max(0.3×lb, 10φ, 100mm)
 *
 * ## Splice Length (l0) - Item 9.5.2
 * - l0 = α × lb,nec ≥ l0,min
 * - α depends on splice percentage and bar spacing
 */

export interface BondStrengthParams {
  /** Characteristic tensile strength inferior (MPa) */
  fctk_inf: number;
  /** Gamma c (default 1.4) */
  gamma_c?: number;
  /** Bar surface type */
  barType: "smooth" | "notched" | "ribbed";
  /** Bond zone */
  bondZone: "good" | "poor";
  /** Bar diameter (mm) */
  diameter: number;
}

export interface AnchorageParams {
  /** Bar diameter (mm) */
  diameter: number;
  /** Steel design yield strength (MPa) */
  fyd: number;
  /** Design bond strength (MPa) */
  fbd: number;
  /** Calculated steel area (cm²) */
  As_calc?: number;
  /** Effective steel area provided (cm²) */
  As_ef?: number;
  /** Anchorage type */
  anchorageType: "straight" | "hook_90" | "hook_180" | "hook_45";
}

export interface SpliceParams {
  /** Required anchorage length (cm) */
  lb_nec: number;
  /** Bar diameter (mm) */
  diameter: number;
  /** Percentage of bars spliced at same section (%) */
  splicePercentage: number;
  /** Spacing between spliced bar axes (cm) */
  barSpacing: number;
}

export interface HookDimensions {
  /** Hook type */
  type: string;
  /** Minimum bend radius (mm) */
  r_min: number;
  /** Straight extension after bend (mm) */
  extension: number;
  /** Total hook development (mm) */
  totalLength: number;
}

export interface AnchorageResult {
  /** Design bond strength (MPa) */
  fbd: number;
  /** η coefficients */
  eta: { eta1: number; eta2: number; eta3: number };
  /** Basic anchorage length (cm) */
  lb: number;
  /** Required anchorage length (cm) */
  lb_nec: number;
  /** Minimum anchorage length (cm) */
  lb_min: number;
  /** Anchorage coefficient α */
  alpha: number;
  /** Hook dimensions if applicable */
  hook?: HookDimensions;
  /** Messages */
  messages: string[];
}

export interface SpliceResult {
  /** Splice length (cm) */
  l0: number;
  /** Minimum splice length (cm) */
  l0_min: number;
  /** Splice coefficient α */
  alpha: number;
  /** Effective α from table */
  alphaTable: number;
  /** Messages */
  messages: string[];
}

/**
 * Get η1 coefficient based on bar type (Table 8.3)
 */
function getEta1(barType: BondStrengthParams["barType"]): number {
  switch (barType) {
    case "smooth":
      return 1.0;
    case "notched":
      return 1.4;
    case "ribbed":
      return 2.25;
    default:
      return 1.0;
  }
}

/**
 * Get η2 coefficient based on bond zone
 */
function getEta2(bondZone: BondStrengthParams["bondZone"]): number {
  return bondZone === "good" ? 1.0 : 0.7;
}

/**
 * Get η3 coefficient based on bar diameter
 */
function getEta3(diameter: number): number {
  if (diameter <= 32) return 1.0;
  return (132 - diameter) / 100;
}

/**
 * Get α coefficient for anchorage type
 */
function getAnchorageAlpha(
  anchorageType: AnchorageParams["anchorageType"],
): number {
  switch (anchorageType) {
    case "straight":
      return 1.0;
    case "hook_90":
      return 0.7;
    case "hook_180":
      return 0.7;
    case "hook_45":
      return 0.7;
    default:
      return 1.0;
  }
}

/**
 * Get splice α coefficient from Table 9.3 - NBR 6118:2023
 *
 * Table 9.3 - Splice coefficient αot
 * ┌──────────────────┬──────────────┬──────────────┬──────────────┐
 * │ % bars spliced   │  a ≤ 5φ      │ 5φ < a ≤ 10φ │  a > 10φ     │
 * │ in same section  │  (or c < 3φ) │ (c ≥ 3φ)     │  (c ≥ 3φ)    │
 * ├──────────────────┼──────────────┼──────────────┼──────────────┤
 * │      ≤ 20%       │     1.2      │     1.0      │     1.0      │
 * │    20% - 25%     │     1.4      │     1.0      │     1.0      │
 * │    25% - 33%     │     1.6      │     1.2      │     1.0      │
 * │    33% - 50%     │     1.8      │     1.4      │     1.2      │
 * │      > 50%       │     2.0      │     1.6      │     1.4      │
 * └──────────────────┴──────────────┴──────────────┴──────────────┘
 * where: a = center-to-center spacing between splices
 *        c = concrete cover
 *        φ = bar diameter
 */
export function getSpliceAlpha(
  splicePercentage: number,
  barSpacing: number,
  diameter: number,
): number {
  // Convert: barSpacing in cm, diameter in mm → spacingRatio in diameters
  const phi_cm = diameter / 10;
  const spacingRatio = barSpacing / phi_cm; // a/φ

  // Column selection based on spacing ratio
  let column: 0 | 1 | 2;
  if (spacingRatio <= 5) {
    column = 0; // a ≤ 5φ (compact)
  } else if (spacingRatio <= 10) {
    column = 1; // 5φ < a ≤ 10φ
  } else {
    column = 2; // a > 10φ (well-spaced)
  }

  // Row selection based on splice percentage
  // NBR 6118:2023 Table 9.3 values [row][column]
  const alphaTable: number[][] = [
    // ≤20%, 20-25%, 25-33%, 33-50%, >50%
    [1.2, 1.4, 1.6, 1.8, 2.0], // column 0: a ≤ 5φ
    [1.0, 1.0, 1.2, 1.4, 1.6], // column 1: 5φ < a ≤ 10φ
    [1.0, 1.0, 1.0, 1.2, 1.4], // column 2: a > 10φ
  ];

  let row: number;
  if (splicePercentage <= 20) {
    row = 0;
  } else if (splicePercentage <= 25) {
    row = 1;
  } else if (splicePercentage <= 33) {
    row = 2;
  } else if (splicePercentage <= 50) {
    row = 3;
  } else {
    row = 4;
  }

  return alphaTable[column][row];
}

/**
 * Calculate hook dimensions
 */
function calculateHookDimensions(
  diameter: number,
  hookType: AnchorageParams["anchorageType"],
  barType: BondStrengthParams["barType"] = "ribbed",
): HookDimensions | undefined {
  if (hookType === "straight") return undefined;

  // Minimum bend radius per NBR 6118:2023 Table 9.1
  let r_min: number;
  if (barType === "smooth") {
    // CA-25
    if (diameter <= 10) r_min = 2 * diameter;
    else if (diameter <= 20) r_min = 4 * diameter;
    else r_min = 6 * diameter;
  } else if (barType === "notched") {
    // CA-60 (fios entalhados)
    r_min = 3 * diameter; // φ ≤ 9.5mm typically
  } else {
    // CA-50 (ribbed)
    if (diameter <= 10) r_min = 5 * diameter;
    else if (diameter <= 20) r_min = 8 * diameter;
    else r_min = 10 * diameter;
  }

  // Straight extension
  let extension: number;
  switch (hookType) {
    case "hook_45":
      extension = 8 * diameter;
      break;
    case "hook_90":
      extension = 8 * diameter;
      break;
    case "hook_180":
      extension = 2 * diameter;
      break;
    default:
      extension = 8 * diameter;
  }

  // Total hook development (arc + extension)
  const arcLength =
    hookType === "hook_180"
      ? Math.PI * r_min
      : hookType === "hook_90"
        ? 0.5 * Math.PI * r_min
        : 0.25 * Math.PI * r_min;

  const totalLength = arcLength + extension;

  return {
    type: hookType,
    r_min,
    extension,
    totalLength,
  };
}

/**
 * Calculate design bond strength (fbd)
 */
export function calculateBondStrength(params: BondStrengthParams): {
  fbd: number;
  eta: { eta1: number; eta2: number; eta3: number };
} {
  const { fctk_inf, gamma_c = 1.4, barType, bondZone, diameter } = params;

  const fctd = fctk_inf / gamma_c;
  const eta1 = getEta1(barType);
  const eta2 = getEta2(bondZone);
  const eta3 = getEta3(diameter);

  const fbd = eta1 * eta2 * eta3 * fctd;

  return { fbd, eta: { eta1, eta2, eta3 } };
}

/**
 * Calculate anchorage lengths
 */
export function calculateAnchorage(
  params: AnchorageParams,
  bondParams: BondStrengthParams,
): AnchorageResult {
  const { diameter, fyd, As_calc, As_ef, anchorageType } = params;

  const messages: string[] = [];

  // Calculate bond strength
  const { fbd, eta } = calculateBondStrength(bondParams);

  // Basic anchorage length: lb = (φ/4) × (fyd/fbd)
  // φ in mm, fyd and fbd in MPa → lb in mm, convert to cm
  const lb_mm = (diameter / 4) * (fyd / fbd);
  const lb = lb_mm / 10; // cm

  // Anchorage coefficient
  const alpha = getAnchorageAlpha(anchorageType);

  // Area ratio (if provided)
  const areaRatio = As_calc && As_ef && As_ef > 0 ? As_calc / As_ef : 1.0;

  // Required anchorage length
  let lb_nec = alpha * lb * areaRatio;

  // Minimum anchorage length
  const lb_min = Math.max(0.3 * lb, (10 * diameter) / 10, 10); // in cm

  lb_nec = Math.max(lb_nec, lb_min);

  // Hook dimensions
  const hook = calculateHookDimensions(
    diameter,
    anchorageType,
    bondParams.barType,
  );

  if (alpha < 1.0) {
    messages.push(
      `✅ Gancho reduz comprimento em ${((1 - alpha) * 100).toFixed(0)}%`,
    );
  }

  if (bondParams.bondZone === "poor") {
    messages.push("⚠️ Zona de má aderência: comprimento aumentado");
  }

  messages.push(
    `ℹ️ lb = ${lb.toFixed(1)} cm, lb,nec = ${lb_nec.toFixed(1)} cm`,
  );

  return {
    fbd,
    eta,
    lb,
    lb_nec,
    lb_min,
    alpha,
    hook,
    messages,
  };
}

/**
 * Calculate splice length
 */
export function calculateSplice(params: SpliceParams): SpliceResult {
  const { lb_nec, diameter, splicePercentage, barSpacing } = params;

  const messages: string[] = [];

  // Get α from table
  const alphaTable = getSpliceAlpha(splicePercentage, barSpacing, diameter);

  // Splice length
  let l0 = alphaTable * lb_nec;

  // Minimum splice length
  const l0_min = Math.max(
    0.3 * alphaTable * lb_nec,
    (15 * diameter) / 10, // in cm
    20, // cm
  );

  l0 = Math.max(l0, l0_min);

  if (splicePercentage > 50) {
    messages.push("⚠️ >50% das barras emendadas: α = " + alphaTable.toFixed(1));
  }

  messages.push(`ℹ️ Emenda por traspasse: l₀ = ${l0.toFixed(1)} cm`);

  return {
    l0,
    l0_min,
    alpha: alphaTable,
    alphaTable,
    messages,
  };
}

/**
 * Full anchorage calculation with materials
 */
export interface FullAnchorageParams {
  diameter: number;
  fyk: number;
  fctk_inf: number;
  barType: "smooth" | "notched" | "ribbed";
  bondZone: "good" | "poor";
  anchorageType: "straight" | "hook_90" | "hook_180" | "hook_45";
  As_calc?: number;
  As_ef?: number;
  splicePercentage?: number;
  barSpacing?: number;
}

export interface FullAnchorageResult {
  anchorage: AnchorageResult;
  splice?: SpliceResult;
}

export function calculateFullAnchorage(
  params: FullAnchorageParams,
): FullAnchorageResult {
  const fyd = params.fyk / 1.15;

  const bondParams: BondStrengthParams = {
    fctk_inf: params.fctk_inf,
    barType: params.barType,
    bondZone: params.bondZone,
    diameter: params.diameter,
  };

  const anchorageParams: AnchorageParams = {
    diameter: params.diameter,
    fyd,
    fbd: 0, // will be calculated
    As_calc: params.As_calc,
    As_ef: params.As_ef,
    anchorageType: params.anchorageType,
  };

  const anchorage = calculateAnchorage(anchorageParams, bondParams);

  let splice: SpliceResult | undefined;
  if (
    params.splicePercentage !== undefined &&
    params.barSpacing !== undefined
  ) {
    splice = calculateSplice({
      lb_nec: anchorage.lb_nec,
      diameter: params.diameter,
      splicePercentage: params.splicePercentage,
      barSpacing: params.barSpacing,
    });
  }

  return { anchorage, splice };
}
