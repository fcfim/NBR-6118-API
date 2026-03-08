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
  classification:
    | "short"
    | "medium"
    | "slender"
    | "verySlender"
    | "notPermitted";
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
  supports: ColumnSupports,
  e1_h_ratio?: number,
): SlendernessResult {
  const i = h / Math.sqrt(12); // radius of gyration for rectangular section
  const k = getEffectiveLengthFactor(supports.top, supports.bottom);
  const Le = k * length;
  const lambda = Le / i;

  // Calculate λ₁ per NBR 6118:2023 Item 15.8.2
  // λ₁ = 25 + 12.5 × (e₁/h) for e₁/h < 2, otherwise λ₁ = 35
  // Clamped to 35 ≤ λ₁ ≤ 90
  let lambda1: number;
  if (e1_h_ratio !== undefined && e1_h_ratio < 2) {
    lambda1 = 25 + 12.5 * e1_h_ratio;
  } else {
    lambda1 = 35;
  }
  lambda1 = Math.max(35, Math.min(90, lambda1));

  let classification: SlendernessResult["classification"];
  let needs2ndOrder = false;

  if (lambda <= lambda1) {
    classification = "short";
    needs2ndOrder = false;
  } else if (lambda <= 90) {
    classification = "medium";
    needs2ndOrder = true;
  } else if (lambda <= 140) {
    classification = "slender";
    needs2ndOrder = true;
  } else if (lambda <= 200) {
    // NBR 6118:2023 Item 15.8.1: λ up to 200 (requires general method)
    classification = "verySlender";
    needs2ndOrder = true;
  } else {
    // λ > 200 is NOT permitted per NBR 6118:2023 Item 15.8.1
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
  nu: number,
): number {
  const oneOverR = 0.005 / ((nu + 0.5) * h);
  const e2 = ((Le * Le) / 10) * oneOverR;
  return e2;
}

/**
 * Calculate reinforcement ratio ω from ν and μ
 * Using iterative section equilibrium solver with dual bisection:
 * - Outer loop: bisection on ω
 * - Inner loop: bisection on ξ to satisfy force equilibrium (ν)
 * - Check: resulting moment μ_calc matches target μ
 *
 * NBR 6118:2023 - Full N-M interaction approach
 *
 * @param nu - Normalized axial force ν = Nd / (Ac × fcd)
 * @param mu - Normalized moment μ = Md / (b × h² × fcd)
 * @param d_prime_ratio - d'/h ratio (default 0.1)
 * @param fck - Concrete strength for stress-block parameters
 * @returns ω - Mechanical reinforcement ratio
 */
function calculateOmega(
  nu: number,
  mu: number,
  d_prime_ratio: number = 0.1,
  fck: number = 30,
  fyk: number = 500,
  Es_GPa: number = 210,
): number {
  // Stress block parameters per NBR 6118:2023
  const lambda_sb = fck <= 50 ? 0.8 : 0.8 - (fck - 50) / 400;
  const alpha_c = fck <= 50 ? 0.85 : 0.85 * (1 - (fck - 50) / 200);
  const epsilon_cu = fck <= 50 ? 3.5 : 2.6 + 35 * Math.pow((90 - fck) / 100, 4);
  const epsilon_yd = (fyk / (1.15 * Es_GPa * 1000)) * 1000; // ‰ for given steel

  /**
   * For a given ξ, compute steel stress ratios
   */
  function getSteelStresses(xi: number): {
    sigma_s: number;
    sigma_s_prime: number;
  } {
    const xi_safe = Math.max(xi, 0.001);
    // Strain at tension steel (bottom face)
    const eps_s = (epsilon_cu * (1 - d_prime_ratio - xi_safe)) / xi_safe;
    // Strain at compression steel (top face)
    const eps_s_prime = (epsilon_cu * (xi_safe - d_prime_ratio)) / xi_safe;

    // Stress ratio limited by yield
    const sigma_s =
      Math.min(Math.abs(eps_s) / epsilon_yd, 1.0) * Math.sign(eps_s);
    const sigma_s_prime =
      Math.min(Math.abs(eps_s_prime) / epsilon_yd, 1.0) *
      Math.sign(eps_s_prime);

    return { sigma_s, sigma_s_prime };
  }

  /**
   * For a given ω, find ξ that satisfies force equilibrium:
   * ν = αc × λ × ξ + (ω/2) × σs' - (ω/2) × σs
   */
  function findXi(omega: number): number {
    let xi_low = 0.01;
    let xi_high = 1.5;
    let xi_result = 0.5;

    for (let i = 0; i < 40; i++) {
      const xi_mid = (xi_low + xi_high) / 2;
      const { sigma_s, sigma_s_prime } = getSteelStresses(xi_mid);

      const xi_eff = Math.min(xi_mid, 1.0);
      const nu_calc =
        alpha_c * lambda_sb * xi_eff +
        (omega / 2) * sigma_s_prime -
        (omega / 2) * sigma_s;

      if (Math.abs(nu_calc - nu) < 0.0005) {
        xi_result = xi_mid;
        break;
      }

      if (nu_calc < nu) {
        xi_low = xi_mid;
      } else {
        xi_high = xi_mid;
      }
      xi_result = xi_mid;
    }

    return xi_result;
  }

  /**
   * For a given ω, compute the resulting μ via force-equilibrium ξ
   */
  function computeMu(omega: number): number {
    const xi = findXi(omega);
    const { sigma_s, sigma_s_prime } = getSteelStresses(xi);

    const xi_eff = Math.min(xi, 1.0);
    const mu_concrete =
      alpha_c * lambda_sb * xi_eff * (0.5 - (lambda_sb * xi_eff) / 2);

    const lever_arm = 0.5 - d_prime_ratio;
    const mu_steel =
      (omega / 2) * sigma_s_prime * lever_arm +
      (omega / 2) * sigma_s * lever_arm;

    return mu_concrete + mu_steel;
  }

  // Outer bisection on ω
  let omega_low = 0;
  let omega_high = 4.0;
  let omega_result = 0;

  for (let iter = 0; iter < 60; iter++) {
    const omega_mid = (omega_low + omega_high) / 2;
    const mu_calc = computeMu(omega_mid);

    if (Math.abs(mu_calc - mu) < 0.0005) {
      omega_result = omega_mid;
      break;
    }

    if (mu_calc < mu) {
      omega_low = omega_mid;
    } else {
      omega_high = omega_mid;
    }
    omega_result = omega_mid;
  }

  return Math.max(0, omega_result);
}

/**
 * Calculate column reinforcement
 */
export function calculateColumnDesign(
  params: ColumnDesignParams,
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
  const M1d_x = Math.max(
    Math.abs(loading.Mx_top || 0),
    Math.abs(loading.Mx_bot || 0),
    M1d_min_x,
  );
  const M1d_y = Math.max(
    Math.abs(loading.My_top || 0),
    Math.abs(loading.My_bot || 0),
    M1d_min_y,
  );

  // Second-order eccentricities
  let e2_x = 0;
  let e2_y = 0;

  if (slendernessX.needs2ndOrder) {
    e2_x = calculateSecondOrderEccentricity(slendernessX.Le, bx, nu);
    messages.push(
      `ℹ️ Efeitos de 2ª ordem considerados em X (λ = ${slendernessX.lambda.toFixed(
        1,
      )})`,
    );
  }

  if (slendernessY.needs2ndOrder) {
    e2_y = calculateSecondOrderEccentricity(slendernessY.Le, by, nu);
    messages.push(
      `ℹ️ Efeitos de 2ª ordem considerados em Y (λ = ${slendernessY.lambda.toFixed(
        1,
      )})`,
    );
  }

  // Total design moments
  const Md_x = M1d_x + Nd * e2_x;
  const Md_y = M1d_y + Nd * e2_y;

  // Normalized moments: μ = Md / (b × h² × fcd)
  // For bending about X axis: b = by (perpendicular), h = bx (parallel)
  // For bending about Y axis: b = bx (perpendicular), h = by (parallel)
  const mu_x = Md_x / (by * bx * bx * fcd);
  const mu_y = Md_y / (bx * by * by * fcd);

  // Use governing direction for design (simplified uniaxial approach)
  const mu_governing = Math.max(mu_x, mu_y);

  // Calculate omega
  const omega = calculateOmega(nu, mu_governing, d_prime / bx, fck, fyk);

  // Required reinforcement
  const As_required = (omega * Ac * fcd) / fyd;

  // Minimum reinforcement per NBR 6118:2023 Item 17.3.5.3
  // As_min = max(0.4% × Ac, 0.4% × Nd / fyd)
  const As_min_geometric = 0.004 * Ac;
  const As_min_force = (0.004 * Nd) / (fyd * 10); // fyd in kN/cm², Nd in kN
  const As_min = Math.max(As_min_geometric, As_min_force);

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
  cover: number,
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
