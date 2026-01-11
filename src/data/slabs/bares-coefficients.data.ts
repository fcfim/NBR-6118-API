/**
 * Bares/Marcus Coefficients for Slab Design - NBR 6118:2023
 *
 * Provides moment coefficients (μ) for two-way slabs based on:
 * - Aspect ratio λ = Ly/Lx
 * - Support conditions (cases 1-6)
 *
 * Formulas:
 * - Mx = μx × p × Lx²
 * - My = μy × p × Lx²
 *
 * Support notation:
 * - A = Simply supported (Apoiado)
 * - E = Fixed (Engastado)
 *
 * Cases:
 * 1. AAAA - All edges simply supported
 * 2. EAAA - One short edge fixed
 * 3. AEAA - One long edge fixed
 * 4. EAEA - Two opposite short edges fixed
 * 5. AEAE - Two opposite long edges fixed
 * 6. EEAA - Two adjacent edges fixed
 * 7. EAAE - Two adjacent (diagonal) fixed
 * 8. EEEA - Three edges fixed
 * 9. EEEE - All edges fixed
 */

export interface SlabCoefficients {
  /** Positive moment coefficient in X */
  mx_pos: number;
  /** Positive moment coefficient in Y */
  my_pos: number;
  /** Negative moment at fixed edge (X direction) */
  mx_neg?: number;
  /** Negative moment at fixed edge (Y direction) */
  my_neg?: number;
}

export type SupportCase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Bares coefficients table
 * Key = λ value (string for lookup), Value = coefficients by case
 */
const BARES_TABLE: Record<string, Record<SupportCase, SlabCoefficients>> = {
  "1.00": {
    1: { mx_pos: 0.0479, my_pos: 0.0479 },
    2: { mx_pos: 0.0365, my_pos: 0.0479, mx_neg: 0.0833 },
    3: { mx_pos: 0.0479, my_pos: 0.0365, my_neg: 0.0833 },
    4: { mx_pos: 0.0271, my_pos: 0.0479, mx_neg: 0.0625 },
    5: { mx_pos: 0.0479, my_pos: 0.0271, my_neg: 0.0625 },
    6: { mx_pos: 0.0365, my_pos: 0.0365, mx_neg: 0.0833, my_neg: 0.0833 },
    7: { mx_pos: 0.0365, my_pos: 0.0365, mx_neg: 0.0833, my_neg: 0.0833 },
    8: { mx_pos: 0.0271, my_pos: 0.0365, mx_neg: 0.0625, my_neg: 0.0833 },
    9: { mx_pos: 0.0271, my_pos: 0.0271, mx_neg: 0.0625, my_neg: 0.0625 },
  },
  "1.10": {
    1: { mx_pos: 0.0554, my_pos: 0.0481 },
    2: { mx_pos: 0.0418, my_pos: 0.0481, mx_neg: 0.0958 },
    3: { mx_pos: 0.0554, my_pos: 0.0367, my_neg: 0.085 },
    4: { mx_pos: 0.0307, my_pos: 0.0481, mx_neg: 0.0714 },
    5: { mx_pos: 0.0554, my_pos: 0.0273, my_neg: 0.0637 },
    6: { mx_pos: 0.0418, my_pos: 0.0367, mx_neg: 0.0958, my_neg: 0.085 },
    7: { mx_pos: 0.0418, my_pos: 0.0367, mx_neg: 0.0958, my_neg: 0.085 },
    8: { mx_pos: 0.0307, my_pos: 0.0367, mx_neg: 0.0714, my_neg: 0.085 },
    9: { mx_pos: 0.0307, my_pos: 0.0273, mx_neg: 0.0714, my_neg: 0.0637 },
  },
  "1.20": {
    1: { mx_pos: 0.0627, my_pos: 0.048 },
    2: { mx_pos: 0.047, my_pos: 0.048, mx_neg: 0.108 },
    3: { mx_pos: 0.0627, my_pos: 0.0366, my_neg: 0.0866 },
    4: { mx_pos: 0.0343, my_pos: 0.048, mx_neg: 0.08 },
    5: { mx_pos: 0.0627, my_pos: 0.0272, my_neg: 0.0648 },
    6: { mx_pos: 0.047, my_pos: 0.0366, mx_neg: 0.108, my_neg: 0.0866 },
    7: { mx_pos: 0.047, my_pos: 0.0366, mx_neg: 0.108, my_neg: 0.0866 },
    8: { mx_pos: 0.0343, my_pos: 0.0366, mx_neg: 0.08, my_neg: 0.0866 },
    9: { mx_pos: 0.0343, my_pos: 0.0272, mx_neg: 0.08, my_neg: 0.0648 },
  },
  "1.30": {
    1: { mx_pos: 0.0694, my_pos: 0.0474 },
    2: { mx_pos: 0.0518, my_pos: 0.0474, mx_neg: 0.119 },
    3: { mx_pos: 0.0694, my_pos: 0.0361, my_neg: 0.0878 },
    4: { mx_pos: 0.0376, my_pos: 0.0474, mx_neg: 0.088 },
    5: { mx_pos: 0.0694, my_pos: 0.0268, my_neg: 0.0656 },
    6: { mx_pos: 0.0518, my_pos: 0.0361, mx_neg: 0.119, my_neg: 0.0878 },
    7: { mx_pos: 0.0518, my_pos: 0.0361, mx_neg: 0.119, my_neg: 0.0878 },
    8: { mx_pos: 0.0376, my_pos: 0.0361, mx_neg: 0.088, my_neg: 0.0878 },
    9: { mx_pos: 0.0376, my_pos: 0.0268, mx_neg: 0.088, my_neg: 0.0656 },
  },
  "1.40": {
    1: { mx_pos: 0.0755, my_pos: 0.0465 },
    2: { mx_pos: 0.0561, my_pos: 0.0465, mx_neg: 0.129 },
    3: { mx_pos: 0.0755, my_pos: 0.0354, my_neg: 0.0889 },
    4: { mx_pos: 0.0406, my_pos: 0.0465, mx_neg: 0.0954 },
    5: { mx_pos: 0.0755, my_pos: 0.0262, my_neg: 0.0663 },
    6: { mx_pos: 0.0561, my_pos: 0.0354, mx_neg: 0.129, my_neg: 0.0889 },
    7: { mx_pos: 0.0561, my_pos: 0.0354, mx_neg: 0.129, my_neg: 0.0889 },
    8: { mx_pos: 0.0406, my_pos: 0.0354, mx_neg: 0.0954, my_neg: 0.0889 },
    9: { mx_pos: 0.0406, my_pos: 0.0262, mx_neg: 0.0954, my_neg: 0.0663 },
  },
  "1.50": {
    1: { mx_pos: 0.0812, my_pos: 0.0454 },
    2: { mx_pos: 0.0601, my_pos: 0.0454, mx_neg: 0.1385 },
    3: { mx_pos: 0.0812, my_pos: 0.0345, my_neg: 0.0897 },
    4: { mx_pos: 0.0432, my_pos: 0.0454, mx_neg: 0.102 },
    5: { mx_pos: 0.0812, my_pos: 0.0255, my_neg: 0.0668 },
    6: { mx_pos: 0.0601, my_pos: 0.0345, mx_neg: 0.1385, my_neg: 0.0897 },
    7: { mx_pos: 0.0601, my_pos: 0.0345, mx_neg: 0.1385, my_neg: 0.0897 },
    8: { mx_pos: 0.0432, my_pos: 0.0345, mx_neg: 0.102, my_neg: 0.0897 },
    9: { mx_pos: 0.0432, my_pos: 0.0255, mx_neg: 0.102, my_neg: 0.0668 },
  },
  "1.60": {
    1: { mx_pos: 0.0862, my_pos: 0.044 },
    2: { mx_pos: 0.0636, my_pos: 0.044, mx_neg: 0.147 },
    3: { mx_pos: 0.0862, my_pos: 0.0335, my_neg: 0.0903 },
    4: { mx_pos: 0.0455, my_pos: 0.044, mx_neg: 0.108 },
    5: { mx_pos: 0.0862, my_pos: 0.0247, my_neg: 0.0672 },
    6: { mx_pos: 0.0636, my_pos: 0.0335, mx_neg: 0.147, my_neg: 0.0903 },
    7: { mx_pos: 0.0636, my_pos: 0.0335, mx_neg: 0.147, my_neg: 0.0903 },
    8: { mx_pos: 0.0455, my_pos: 0.0335, mx_neg: 0.108, my_neg: 0.0903 },
    9: { mx_pos: 0.0455, my_pos: 0.0247, mx_neg: 0.108, my_neg: 0.0672 },
  },
  "1.70": {
    1: { mx_pos: 0.0908, my_pos: 0.0425 },
    2: { mx_pos: 0.0668, my_pos: 0.0425, mx_neg: 0.1545 },
    3: { mx_pos: 0.0908, my_pos: 0.0323, my_neg: 0.0908 },
    4: { mx_pos: 0.0476, my_pos: 0.0425, mx_neg: 0.1135 },
    5: { mx_pos: 0.0908, my_pos: 0.0239, my_neg: 0.0675 },
    6: { mx_pos: 0.0668, my_pos: 0.0323, mx_neg: 0.1545, my_neg: 0.0908 },
    7: { mx_pos: 0.0668, my_pos: 0.0323, mx_neg: 0.1545, my_neg: 0.0908 },
    8: { mx_pos: 0.0476, my_pos: 0.0323, mx_neg: 0.1135, my_neg: 0.0908 },
    9: { mx_pos: 0.0476, my_pos: 0.0239, mx_neg: 0.1135, my_neg: 0.0675 },
  },
  "1.80": {
    1: { mx_pos: 0.0948, my_pos: 0.041 },
    2: { mx_pos: 0.0697, my_pos: 0.041, mx_neg: 0.1615 },
    3: { mx_pos: 0.0948, my_pos: 0.0311, my_neg: 0.0912 },
    4: { mx_pos: 0.0494, my_pos: 0.041, mx_neg: 0.1185 },
    5: { mx_pos: 0.0948, my_pos: 0.023, my_neg: 0.0677 },
    6: { mx_pos: 0.0697, my_pos: 0.0311, mx_neg: 0.1615, my_neg: 0.0912 },
    7: { mx_pos: 0.0697, my_pos: 0.0311, mx_neg: 0.1615, my_neg: 0.0912 },
    8: { mx_pos: 0.0494, my_pos: 0.0311, mx_neg: 0.1185, my_neg: 0.0912 },
    9: { mx_pos: 0.0494, my_pos: 0.023, mx_neg: 0.1185, my_neg: 0.0677 },
  },
  "1.90": {
    1: { mx_pos: 0.0985, my_pos: 0.0395 },
    2: { mx_pos: 0.0723, my_pos: 0.0395, mx_neg: 0.168 },
    3: { mx_pos: 0.0985, my_pos: 0.0299, my_neg: 0.0915 },
    4: { mx_pos: 0.0511, my_pos: 0.0395, mx_neg: 0.123 },
    5: { mx_pos: 0.0985, my_pos: 0.0221, my_neg: 0.0679 },
    6: { mx_pos: 0.0723, my_pos: 0.0299, mx_neg: 0.168, my_neg: 0.0915 },
    7: { mx_pos: 0.0723, my_pos: 0.0299, mx_neg: 0.168, my_neg: 0.0915 },
    8: { mx_pos: 0.0511, my_pos: 0.0299, mx_neg: 0.123, my_neg: 0.0915 },
    9: { mx_pos: 0.0511, my_pos: 0.0221, mx_neg: 0.123, my_neg: 0.0679 },
  },
  "2.00": {
    1: { mx_pos: 0.1017, my_pos: 0.0379 },
    2: { mx_pos: 0.0746, my_pos: 0.0379, mx_neg: 0.174 },
    3: { mx_pos: 0.1017, my_pos: 0.0287, my_neg: 0.0918 },
    4: { mx_pos: 0.0525, my_pos: 0.0379, mx_neg: 0.127 },
    5: { mx_pos: 0.1017, my_pos: 0.0212, my_neg: 0.068 },
    6: { mx_pos: 0.0746, my_pos: 0.0287, mx_neg: 0.174, my_neg: 0.0918 },
    7: { mx_pos: 0.0746, my_pos: 0.0287, mx_neg: 0.174, my_neg: 0.0918 },
    8: { mx_pos: 0.0525, my_pos: 0.0287, mx_neg: 0.127, my_neg: 0.0918 },
    9: { mx_pos: 0.0525, my_pos: 0.0212, mx_neg: 0.127, my_neg: 0.068 },
  },
};

/**
 * Get available λ values
 */
const LAMBDA_VALUES = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0];

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate coefficient between two λ values
 */
function interpolateCoefficient(
  coef1: number,
  coef2: number,
  lambda: number,
  lambda1: number,
  lambda2: number
): number {
  const t = (lambda - lambda1) / (lambda2 - lambda1);
  return lerp(coef1, coef2, t);
}

/**
 * Get Bares coefficients for given λ and support case
 */
export function getBaresCoefficients(
  lambda: number,
  supportCase: SupportCase
): SlabCoefficients {
  // Clamp λ to valid range
  const clampedLambda = Math.max(1.0, Math.min(2.0, lambda));

  // Find bounding λ values
  let lowerLambda = 1.0;
  let upperLambda = 2.0;

  for (let i = 0; i < LAMBDA_VALUES.length - 1; i++) {
    if (
      clampedLambda >= LAMBDA_VALUES[i] &&
      clampedLambda <= LAMBDA_VALUES[i + 1]
    ) {
      lowerLambda = LAMBDA_VALUES[i];
      upperLambda = LAMBDA_VALUES[i + 1];
      break;
    }
  }

  // Get coefficients for bounding values
  const lowerKey = lowerLambda.toFixed(2);
  const upperKey = upperLambda.toFixed(2);

  const lowerCoefs = BARES_TABLE[lowerKey][supportCase];
  const upperCoefs = BARES_TABLE[upperKey][supportCase];

  // Interpolate
  const result: SlabCoefficients = {
    mx_pos: interpolateCoefficient(
      lowerCoefs.mx_pos,
      upperCoefs.mx_pos,
      clampedLambda,
      lowerLambda,
      upperLambda
    ),
    my_pos: interpolateCoefficient(
      lowerCoefs.my_pos,
      upperCoefs.my_pos,
      clampedLambda,
      lowerLambda,
      upperLambda
    ),
  };

  if (lowerCoefs.mx_neg !== undefined && upperCoefs.mx_neg !== undefined) {
    result.mx_neg = interpolateCoefficient(
      lowerCoefs.mx_neg,
      upperCoefs.mx_neg,
      clampedLambda,
      lowerLambda,
      upperLambda
    );
  }

  if (lowerCoefs.my_neg !== undefined && upperCoefs.my_neg !== undefined) {
    result.my_neg = interpolateCoefficient(
      lowerCoefs.my_neg,
      upperCoefs.my_neg,
      clampedLambda,
      lowerLambda,
      upperLambda
    );
  }

  return result;
}

/**
 * Determine support case from edge conditions
 */
export function determineSupportCase(
  top: "free" | "simply" | "fixed",
  bottom: "free" | "simply" | "fixed",
  left: "free" | "simply" | "fixed",
  right: "free" | "simply" | "fixed"
): SupportCase {
  const isFixedTop = top === "fixed";
  const isFixedBottom = bottom === "fixed";
  const isFixedLeft = left === "fixed";
  const isFixedRight = right === "fixed";

  const fixedCount = [
    isFixedTop,
    isFixedBottom,
    isFixedLeft,
    isFixedRight,
  ].filter(Boolean).length;

  if (fixedCount === 0) return 1; // All simply supported
  if (fixedCount === 4) return 9; // All fixed

  if (fixedCount === 1) {
    if (isFixedLeft || isFixedRight) return 2; // One short edge fixed
    return 3; // One long edge fixed
  }

  if (fixedCount === 2) {
    // Two opposite
    if ((isFixedLeft && isFixedRight) || (isFixedTop && isFixedBottom)) {
      if (isFixedLeft && isFixedRight) return 4; // Opposite short
      return 5; // Opposite long
    }
    // Two adjacent
    return 6;
  }

  if (fixedCount === 3) return 8;

  return 1; // Default
}

/**
 * Minimum slab thickness (cm) - Item 13.2.4.1
 */
export function getMinimumThickness(
  slabType: "floor" | "roof" | "cantilever" | "prestressed"
): number {
  switch (slabType) {
    case "floor":
      return 8;
    case "roof":
      return 7;
    case "cantilever":
      return 10;
    case "prestressed":
      return 15;
    default:
      return 8;
  }
}

/**
 * Minimum reinforcement ratio - Table 19.1
 */
export function getMinimumReinforcementRatio(fck: number): number {
  if (fck <= 30) return 0.0015;
  if (fck <= 35) return 0.00173;
  if (fck <= 40) return 0.002;
  if (fck <= 45) return 0.00224;
  if (fck <= 50) return 0.0025;
  return 0.0026;
}
