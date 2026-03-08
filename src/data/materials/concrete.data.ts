/**
 * Concrete Properties Data - NBR 6118:2023
 *
 * Pre-calculated properties for standard concrete classes
 * from C20 to C90 according to NBR 6118:2023.
 *
 * ## Formulas (Section 8.2 - NBR 6118:2023)
 *
 * ### Tensile Strength (fctm)
 * - For fck ≤ 50 MPa: fctm = 0.3 × fck^(2/3)
 * - For fck > 50 MPa: fctm = 2.12 × ln(1 + 0.11 × fck)
 *
 * ### Characteristic Tensile Strengths
 * - fctk,inf = 0.7 × fctm (5% quantile)
 * - fctk,sup = 1.3 × fctm (95% quantile)
 *
 * ### Modulus of Elasticity (Section 8.2.8 - NBR 6118:2023)
 * - For fck ≤ 50 MPa: Eci = αe × 5600 × √fck
 * - For fck > 50 MPa: Eci = αe × 21500 × ((fck/10) + 1.25)^(1/3)
 *
 * αe depends on aggregate type:
 * - Basalt/Diabase: 1.2
 * - Granite/Gneiss: 1.0 (default)
 * - Limestone: 0.9
 * - Sandstone: 0.7
 *
 * ### Secant Modulus
 * - αi = 0.8 + 0.2 × (fck/80) ≤ 1.0
 * - Ecs = αi × Eci
 *
 * ### Rectangular Stress Block Parameters (Section 8.2.10.1)
 * - For fck ≤ 50 MPa: λ = 0.8, αc = 0.85
 * - For fck > 50 MPa:
 *   - λ = 0.8 - (fck - 50)/400
 *   - αc = 0.85 × [1 - (fck - 50)/200]
 *
 * ### Design Values
 * - fcd = fck / γc (γc = 1.4 for normal combinations)
 * - fctd = fctk,inf / γc
 */

export interface ConcreteProperties {
  /** Characteristic compressive strength (MPa) */
  fck: number;
  /** Design compressive strength (MPa) - fck/1.4 */
  fcd: number;
  /** Mean tensile strength (MPa) */
  fctm: number;
  /** Characteristic tensile strength - inferior (MPa) */
  fctk_inf: number;
  /** Characteristic tensile strength - superior (MPa) */
  fctk_sup: number;
  /** Initial tangent modulus (GPa) */
  Eci: number;
  /** Secant modulus (GPa) */
  Ecs: number;
  /** Stress block height factor (λ) */
  lambda: number;
  /** Stress block intensity factor (αc) */
  alpha_c: number;
  /** Ratio αi = Ecs/Eci */
  alpha_i: number;
  /** Strain at peak stress εc2 (‰) */
  epsilon_c2: number;
  /** Ultimate strain εcu (‰) */
  epsilon_cu: number;
}

/** Aggregate type options for Eci calculation */
export type AggregateType = "basalt" | "granite" | "limestone" | "sandstone";

const AGGREGATE_FACTORS: Record<AggregateType, number> = {
  basalt: 1.2,
  granite: 1.0,
  limestone: 0.9,
  sandstone: 0.7,
};

/**
 * Calculate concrete properties from fck
 * @param fck Characteristic compressive strength (MPa)
 * @param aggregate Aggregate type (default: granite)
 */
export function calcConcreteProperties(
  fck: number,
  aggregate: AggregateType = "granite",
): ConcreteProperties {
  const alpha_e = AGGREGATE_FACTORS[aggregate];

  // Mean tensile strength
  const fctm =
    fck <= 50 ? 0.3 * Math.pow(fck, 2 / 3) : 2.12 * Math.log(1 + 0.11 * fck);

  // Characteristic tensile strengths
  const fctk_inf = 0.7 * fctm;
  const fctk_sup = 1.3 * fctm;

  // Initial tangent modulus (GPa)
  const Eci =
    fck <= 50
      ? (alpha_e * 5600 * Math.sqrt(fck)) / 1000
      : (alpha_e * 21500 * Math.pow(fck / 10 + 1.25, 1 / 3)) / 1000;

  // Ratio αi
  const alpha_i = Math.min(0.8 + 0.2 * (fck / 80), 1.0);

  // Secant modulus
  const Ecs = alpha_i * Eci;

  // Stress block parameters
  const lambda = fck <= 50 ? 0.8 : 0.8 - (fck - 50) / 400;
  const alpha_c = fck <= 50 ? 0.85 : 0.85 * (1 - (fck - 50) / 200);

  // Strain limits (‰)
  let epsilon_c2: number;
  let epsilon_cu: number;

  if (fck <= 50) {
    epsilon_c2 = 2.0;
    epsilon_cu = 3.5;
  } else {
    epsilon_c2 = 2.0 + 0.085 * Math.pow(fck - 50, 0.53);
    epsilon_cu = 2.6 + 35 * Math.pow((90 - fck) / 100, 4);
  }

  return {
    fck,
    fcd: fck / 1.4,
    fctm,
    fctk_inf,
    fctk_sup,
    Eci,
    Ecs,
    lambda,
    alpha_c,
    alpha_i,
    epsilon_c2,
    epsilon_cu,
  };
}

/**
 * Pre-calculated concrete classes (using granite aggregate as default)
 */
export const CONCRETE_CLASSES: Record<string, ConcreteProperties> = {
  C20: calcConcreteProperties(20),
  C25: calcConcreteProperties(25),
  C30: calcConcreteProperties(30),
  C35: calcConcreteProperties(35),
  C40: calcConcreteProperties(40),
  C45: calcConcreteProperties(45),
  C50: calcConcreteProperties(50),
  C55: calcConcreteProperties(55),
  C60: calcConcreteProperties(60),
  C65: calcConcreteProperties(65),
  C70: calcConcreteProperties(70),
  C75: calcConcreteProperties(75),
  C80: calcConcreteProperties(80),
  C85: calcConcreteProperties(85),
  C90: calcConcreteProperties(90),
};

/**
 * Get list of available concrete class names
 */
export const CONCRETE_CLASS_NAMES = Object.keys(CONCRETE_CLASSES) as Array<
  keyof typeof CONCRETE_CLASSES
>;

/**
 * Safety coefficient for concrete (γc)
 * - Normal/Special/Construction combinations: 1.4
 * - Exceptional combinations: 1.2
 */
export const GAMMA_C = {
  normal: 1.4,
  exceptional: 1.2,
};
