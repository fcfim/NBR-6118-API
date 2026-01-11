/**
 * Column Design Core Logic - NBR 6118:2023
 *
 * Calculates column reinforcement considering slenderness and second-order effects.
 *
 * ## Classification by Slenderness (λ) - Item 15.8.2
 * - λ ≤ 40: Short column (no 2nd order effects needed)
 * - 40 < λ ≤ 90: Medium column (simplified method)
 * - 90 < λ ≤ 140: Slender column (general method required)
 * - λ > 200: Not permitted
 *
 * ## Equivalent Length (Le) - Item 15.6
 * - Fixed-Fixed: Le = 0.5L
 * - Fixed-Pinned: Le = 0.7L
 * - Pinned-Pinned: Le = 1.0L
 * - Fixed-Free: Le = 2.0L
 *
 * ## Minimum First-Order Moment - Item 11.3.3.4.3
 * - M1d,min = Nd × (0.015 + 0.03h) where h in meters
 *
 * ## Second-Order Effects - Standard Column Method - Item 15.8.3.3.3
 * - e2 = (Le² / 10) × (1/r)
 * - 1/r = 0.005 / ((ν + 0.5) × h)
 * - ν = Nd / (Ac × fcd)
 *
 * ## Combined Bending Design
 * - Use iterative method to find reinforcement for N + M
 */

export interface ColumnGeometry {
  /** Width in x direction (cm) */
  bx: number;
  /** Width in y direction (cm) */
  by: number;
}

export interface ColumnSupports {
  /** Top support condition */
  top: "fixed" | "pinned";
  /** Bottom support condition */
  bottom: "fixed" | "pinned";
}

export interface ColumnLoading {
  /** Design axial force (kN) - positive for compression */
  Nd: number;
  /** First-order moment at top - x direction (kN.cm) */
  Mx_top?: number;
  /** First-order moment at bottom - x direction (kN.cm) */
  Mx_bot?: number;
  /** First-order moment at top - y direction (kN.cm) */
  My_top?: number;
  /** First-order moment at bottom - y direction (kN.cm) */
  My_bot?: number;
}

export interface ColumnDesignParams {
  geometry: ColumnGeometry;
  /** Column total length (cm) */
  length: number;
  supports: ColumnSupports;
  loading: ColumnLoading;
  /** Characteristic compressive strength (MPa) */
  fck: number;
  /** Steel yield strength (MPa) */
  fyk: number;
  /** Concrete cover (cm) */
  cover: number;
  /** Stirrup diameter (mm) */
  stirrupDiameter?: number;
  /** Main bar diameter (mm) - estimate for d' calculation */
  mainBarDiameter?: number;
}

export interface SlendernessResult {
  /** Direction */
  direction: "x" | "y";
  /** Column dimension in this direction (cm) */
  h: number;
  /** Radius of gyration (cm) */
  i: number;
  /** Effective length factor k */
  k: number;
  /** Effective length Le (cm) */
  Le: number;
  /** Slenderness ratio λ */
  lambda: number;
  /** Classification */
  classification: "short" | "medium" | "slender" | "notPermitted";
  /** Needs 2nd order analysis */
  needs2ndOrder: boolean;
}

export interface ColumnDesignResult {
  geometry: {
    bx: number;
    by: number;
    Ac: number;
    cover: number;
    d_prime: number;
  };
  slenderness: {
    x: SlendernessResult;
    y: SlendernessResult;
    governing: "x" | "y";
  };
  moments: {
    /** Minimum moment x (kN.cm) */
    M1d_min_x: number;
    /** Minimum moment y (kN.cm) */
    M1d_min_y: number;
    /** First-order design moment x (kN.cm) */
    M1d_x: number;
    /** First-order design moment y (kN.cm) */
    M1d_y: number;
    /** Second-order eccentricity x (cm) */
    e2_x: number;
    /** Second-order eccentricity y (cm) */
    e2_y: number;
    /** Total design moment x (kN.cm) */
    Md_x: number;
    /** Total design moment y (kN.cm) */
    Md_y: number;
  };
  reinforcement: {
    /** Normalized axial force ν */
    nu: number;
    /** Normalized moment x μ */
    mu_x: number;
    /** Normalized moment y μ */
    mu_y: number;
    /** Mechanical reinforcement ratio ω */
    omega: number;
    /** Required steel area (cm²) */
    As_required: number;
    /** Minimum steel area (cm²) */
    As_min: number;
    /** Governing steel area (cm²) */
    As: number;
    /** Reinforcement ratio (%) */
    rho: number;
  };
  detailing: {
    diameter: number;
    quantity: number;
    As_provided: number;
    distribution: string;
  }[];
  status: {
    isValid: boolean;
    messages: string[];
  };
}

/**
 * Get effective length factor k based on support conditions
 */
function getEffectiveLengthFactor(top: string, bottom: string): number {
  if (top === "fixed" && bottom === "fixed") return 0.5;
  if (
    (top === "fixed" && bottom === "pinned") ||
    (top === "pinned" && bottom === "fixed")
  )
    return 0.7;
  if (top === "pinned" && bottom === "pinned") return 1.0;
  // Fixed-Free (cantilever column)
  return 2.0;
}

/**
 * Calculate slenderness for one direction
 */
function calculateSlenderness(
  h: number,
  length: number,
  supports: ColumnSupports
): SlendernessResult {
  const i = h / Math.sqrt(12); // radius of gyration for rectangular section
  const k = getEffectiveLengthFactor(supports.top, supports.bottom);
  const Le = k * length;
  const lambda = Le / i;

  let classification: SlendernessResult["classification"];
  let needs2ndOrder = false;

  if (lambda <= 40) {
    classification = "short";
    needs2ndOrder = false;
  } else if (lambda <= 90) {
    classification = "medium";
    needs2ndOrder = true;
  } else if (lambda <= 140) {
    classification = "slender";
    needs2ndOrder = true;
  } else {
    classification = "notPermitted";
    needs2ndOrder = true;
  }

  return {
    direction: "x", // will be set by caller
    h,
    i,
    k,
    Le,
    lambda,
    classification,
    needs2ndOrder,
  };
}

/**
 * Calculate minimum first-order moment
 * M1d,min = Nd × (0.015 + 0.03h) where h is in METERS
 */
function calculateMinimumMoment(Nd: number, h_cm: number): number {
  const h_m = h_cm / 100;
  return Nd * (0.015 + 0.03 * h_m) * 100; // convert back to kN.cm
}

/**
 * Calculate second-order eccentricity (standard column method)
 * e2 = (Le² / 10) × (1/r)
 * 1/r = 0.005 / ((ν + 0.5) × h)
 */
function calculateSecondOrderEccentricity(
  Le: number,
  h: number,
  nu: number
): number {
  const oneOverR = 0.005 / ((nu + 0.5) * h);
  const e2 = ((Le * Le) / 10) * oneOverR;
  return e2;
}

/**
 * Calculate reinforcement ratio ω from ν and μ
 * Using simplified approach for symmetric reinforcement
 */
function calculateOmega(nu: number, mu: number): number {
  // Simplified approximation for rectangular section with symmetric reinforcement
  // Based on design charts for d'/h ≈ 0.1

  // Minimum omega for minimum eccentricity
  if (mu <= 0.05) {
    return Math.max(0, nu - 0.4) * 1.2;
  }

  // Iterative approximation using equilibrium
  // For nu between 0 and 1, and mu > 0

  // Use approximate formula: ω ≈ (mu + 0.5*(nu - 0.4)) / 0.85
  // This is a simplification; more accurate would use iterative solver

  let omega = (mu + 0.4 * Math.max(0, nu - 0.3)) / 0.8;

  // Ensure omega is positive
  omega = Math.max(0, omega);

  return omega;
}

/**
 * Calculate column reinforcement
 */
export function calculateColumnDesign(
  params: ColumnDesignParams
): ColumnDesignResult {
  const {
    geometry,
    length,
    supports,
    loading,
    fck,
    fyk,
    cover,
    stirrupDiameter = 5,
    mainBarDiameter = 16,
  } = params;

  const messages: string[] = [];
  const { bx, by } = geometry;
  const { Nd } = loading;

  // Area and effective cover
  const Ac = bx * by;
  const d_prime = cover + stirrupDiameter / 10 + mainBarDiameter / 20;

  // Design strengths
  const fcd = fck / 1.4 / 10; // kN/cm²
  const fyd = fyk / 1.15 / 10; // kN/cm²

  // Slenderness in both directions
  const slendernessX = {
    ...calculateSlenderness(bx, length, supports),
    direction: "x" as const,
  };
  const slendernessY = {
    ...calculateSlenderness(by, length, supports),
    direction: "y" as const,
  };

  // Check if permitted
  if (
    slendernessX.classification === "notPermitted" ||
    slendernessY.classification === "notPermitted"
  ) {
    messages.push("❌ Esbeltez > 140: Pilar não permitido pela NBR 6118");
  }

  if (
    slendernessX.classification === "slender" ||
    slendernessY.classification === "slender"
  ) {
    messages.push("⚠️ Pilar esbelto: Método simplificado pode ser impreciso");
  }

  // Governing direction
  const governing = slendernessX.lambda >= slendernessY.lambda ? "x" : "y";

  // Normalized axial force
  const nu = Nd / (Ac * fcd);

  if (nu > 0.85) {
    messages.push("⚠️ ν > 0.85: Pilar muito solicitado");
  }

  // Minimum moments
  const M1d_min_x = calculateMinimumMoment(Nd, bx);
  const M1d_min_y = calculateMinimumMoment(Nd, by);

  // First-order moments (use max of top/bottom, apply minimum)
  let M1d_x = Math.max(
    Math.abs(loading.Mx_top || 0),
    Math.abs(loading.Mx_bot || 0),
    M1d_min_x
  );
  let M1d_y = Math.max(
    Math.abs(loading.My_top || 0),
    Math.abs(loading.My_bot || 0),
    M1d_min_y
  );

  // Second-order eccentricities
  let e2_x = 0;
  let e2_y = 0;

  if (slendernessX.needs2ndOrder) {
    e2_x = calculateSecondOrderEccentricity(slendernessX.Le, bx, nu);
    messages.push(
      `ℹ️ Efeitos de 2ª ordem considerados em X (λ = ${slendernessX.lambda.toFixed(
        1
      )})`
    );
  }

  if (slendernessY.needs2ndOrder) {
    e2_y = calculateSecondOrderEccentricity(slendernessY.Le, by, nu);
    messages.push(
      `ℹ️ Efeitos de 2ª ordem considerados em Y (λ = ${slendernessY.lambda.toFixed(
        1
      )})`
    );
  }

  // Total design moments
  const Md_x = M1d_x + Nd * e2_x;
  const Md_y = M1d_y + Nd * e2_y;

  // Normalized moments
  const mu_x = Md_x / (Ac * bx * fcd);
  const mu_y = Md_y / (Ac * by * fcd);

  // Use governing direction for design (simplified uniaxial approach)
  const mu_governing = Math.max(mu_x, mu_y);

  // Calculate omega
  const omega = calculateOmega(nu, mu_governing);

  // Required reinforcement
  const As_required = (omega * Ac * fcd) / fyd;

  // Minimum reinforcement (0.4% of Ac)
  const As_min = 0.004 * Ac;

  // Maximum reinforcement (4% of Ac)
  const As_max = 0.04 * Ac;

  // Governing As
  const As = Math.max(As_required, As_min);

  // Check maximum
  if (As > As_max) {
    messages.push("❌ As > 4%: Armadura excede limite máximo");
  }

  const rho = (As / Ac) * 100;

  // Detailing suggestions
  const detailing = suggestColumnRebars(As, bx, by, cover);

  // Status
  const isValid =
    As <= As_max &&
    slendernessX.classification !== "notPermitted" &&
    slendernessY.classification !== "notPermitted";

  if (isValid) {
    messages.push("✅ Dimensionamento do pilar OK");
  }

  return {
    geometry: {
      bx,
      by,
      Ac,
      cover,
      d_prime,
    },
    slenderness: {
      x: slendernessX,
      y: slendernessY,
      governing,
    },
    moments: {
      M1d_min_x,
      M1d_min_y,
      M1d_x,
      M1d_y,
      e2_x,
      e2_y,
      Md_x,
      Md_y,
    },
    reinforcement: {
      nu,
      mu_x,
      mu_y,
      omega,
      As_required,
      As_min,
      As,
      rho,
    },
    detailing,
    status: {
      isValid,
      messages,
    },
  };
}

/**
 * Suggest rebar configuration for column
 */
function suggestColumnRebars(
  As: number,
  bx: number,
  by: number,
  cover: number
): ColumnDesignResult["detailing"] {
  const suggestions: ColumnDesignResult["detailing"] = [];

  // Common diameters for columns
  const diameters = [12.5, 16, 20, 25];

  for (const diameter of diameters) {
    const areaPerBar = (Math.PI * diameter * diameter) / 400;
    const quantity = Math.ceil(As / areaPerBar);

    // Round up to even number (symmetric distribution)
    const evenQuantity = quantity + (quantity % 2);

    // Minimum 4 bars for rectangular column
    const finalQuantity = Math.max(4, evenQuantity);

    const As_provided = finalQuantity * areaPerBar;

    // Check if bars fit (rough check)
    const perimeterAvailable = 2 * (bx + by) - 8 * cover;
    const barsPerimeter = finalQuantity * (diameter / 10 + 2); // diameter + spacing

    if (barsPerimeter <= perimeterAvailable && As_provided >= As) {
      suggestions.push({
        diameter,
        quantity: finalQuantity,
        As_provided,
        distribution:
          finalQuantity <= 8
            ? `${finalQuantity / 2} barras em cada face maior`
            : `Distribuir nas 4 faces`,
      });
    }
  }

  return suggestions.slice(0, 3);
}
