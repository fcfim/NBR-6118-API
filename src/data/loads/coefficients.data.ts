/**
 * Load Combination Coefficients - NBR 6118:2023
 *
 * Coefficients for load combinations according to Section 11 of NBR 6118:2023.
 *
 * ## Combination Types
 *
 * ### Ultimate Limit State (ELU)
 * - Fd = Σ(γgi × Fgi,k) + γq × [Fq1,k + Σ(ψ0j × Fqj,k)]
 *
 * ### Serviceability Limit State (ELS)
 * - Rare: Fd,ser = Σ Fgi,k + Fq1,k + Σ(ψ1j × Fqj,k)
 * - Frequent: Fd,ser = Σ Fgi,k + ψ1 × Fq1,k + Σ(ψ2j × Fqj,k)
 * - Quasi-permanent: Fd,ser = Σ Fgi,k + Σ(ψ2j × Fqj,k)
 *
 * ## Safety Factors (γ) - Table 11.1
 *
 * | Combination | γg (permanent) | γq (variable) |
 * |-------------|----------------|---------------|
 * | Normal      | 1.4            | 1.4           |
 * | Special     | 1.3            | 1.2           |
 * | Exception   | 1.2            | 1.0           |
 * | Construction| 1.3            | 1.2           |
 *
 * ## Reduction Factors (ψ) - Table 11.2
 *
 * | Action Type                    | ψ0   | ψ1   | ψ2   |
 * |--------------------------------|------|------|------|
 * | Residential buildings          | 0.5  | 0.4  | 0.3  |
 * | Commercial/Office buildings    | 0.7  | 0.6  | 0.4  |
 * | Libraries/Archives             | 0.8  | 0.7  | 0.6  |
 * | Garages                        | 0.8  | 0.7  | 0.6  |
 * | Wind                           | 0.6  | 0.3  | 0.0  |
 * | Temperature                    | 0.6  | 0.5  | 0.3  |
 */

export interface PsiFactors {
  /** Factor for rare combination (ψ0) */
  psi0: number;
  /** Factor for frequent combination (ψ1) */
  psi1: number;
  /** Factor for quasi-permanent combination (ψ2) */
  psi2: number;
  /** Description */
  label: string;
  /** Detailed description */
  description: string;
}

export interface GammaFactors {
  /** Factor for permanent actions (γg) */
  gamma_g: number;
  /** Factor for variable actions (γq) */
  gamma_q: number;
  /** Description */
  label: string;
}

/**
 * Building types with corresponding ψ factors (Table 11.2 - NBR 6118:2023)
 */
export const BUILDING_TYPES: Record<string, PsiFactors> = {
  RESIDENCIAL: {
    psi0: 0.5,
    psi1: 0.4,
    psi2: 0.3,
    label: "Residencial",
    description: "Edifícios residenciais - locais de moradia",
  },
  COMERCIAL: {
    psi0: 0.7,
    psi1: 0.6,
    psi2: 0.4,
    label: "Comercial/Escritórios",
    description:
      "Edifícios comerciais, escritórios, estações, edifícios públicos",
  },
  BIBLIOTECA: {
    psi0: 0.8,
    psi1: 0.7,
    psi2: 0.6,
    label: "Bibliotecas/Arquivos",
    description: "Bibliotecas, arquivos, depósitos, oficinas",
  },
  GARAGEM: {
    psi0: 0.8,
    psi1: 0.7,
    psi2: 0.6,
    label: "Garagens",
    description: "Garagens e estacionamentos de veículos leves",
  },
  INDUSTRIAL_LEVE: {
    psi0: 0.8,
    psi1: 0.7,
    psi2: 0.6,
    label: "Industrial Leve",
    description: "Galpões industriais com carga leve",
  },
  INDUSTRIAL_PESADO: {
    psi0: 1.0,
    psi1: 0.9,
    psi2: 0.8,
    label: "Industrial Pesado",
    description: "Galpões industriais com carga pesada",
  },
  VENTO: {
    psi0: 0.6,
    psi1: 0.3,
    psi2: 0.0,
    label: "Vento",
    description: "Pressão dinâmica do vento nas estruturas em geral",
  },
  TEMPERATURA: {
    psi0: 0.6,
    psi1: 0.5,
    psi2: 0.3,
    label: "Temperatura",
    description:
      "Variações uniformes de temperatura em relação à média anual local",
  },
  PASSARELA: {
    psi0: 0.6,
    psi1: 0.4,
    psi2: 0.3,
    label: "Passarelas",
    description: "Passarelas de pedestres",
  },
};

/**
 * Safety factors for different combination types (Table 11.1 - NBR 6118:2023)
 */
export const SAFETY_FACTORS: Record<string, GammaFactors> = {
  NORMAL: {
    gamma_g: 1.4,
    gamma_q: 1.4,
    label: "Combinação Normal",
  },
  ESPECIAL: {
    gamma_g: 1.3,
    gamma_q: 1.2,
    label: "Combinação Especial ou de Construção",
  },
  EXCEPCIONAL: {
    gamma_g: 1.2,
    gamma_q: 1.0,
    label: "Combinação Excepcional",
  },
  CONSTRUCAO: {
    gamma_g: 1.3,
    gamma_q: 1.2,
    label: "Combinação de Construção",
  },
  // For ELS combinations, γ = 1.0
  ELS: {
    gamma_g: 1.0,
    gamma_q: 1.0,
    label: "Estado Limite de Serviço",
  },
};

/**
 * Get list of available building type keys
 */
export const BUILDING_TYPE_NAMES = Object.keys(BUILDING_TYPES);

/**
 * Get list of available safety factor combination keys
 */
export const SAFETY_FACTOR_NAMES = Object.keys(SAFETY_FACTORS);

/**
 * Favorable permanent loads use reduced γg
 */
export const GAMMA_G_FAVORABLE = {
  normal: 1.0,
  especial: 1.0,
  excepcional: 1.0,
};

/**
 * Calculate ELU moment from characteristic loads
 */
export function calculateMd(
  Mk_g: number,
  Mk_q: number,
  gamma_g: number = 1.4,
  gamma_q: number = 1.4
): number {
  return gamma_g * Mk_g + gamma_q * Mk_q;
}

/**
 * Calculate frequent ELS moment
 */
export function calculateMk_frequent(
  Mk_g: number,
  Mk_q: number,
  psi1: number
): number {
  return Mk_g + psi1 * Mk_q;
}

/**
 * Calculate quasi-permanent ELS moment
 */
export function calculateMk_quasiPermanent(
  Mk_g: number,
  Mk_q: number,
  psi2: number
): number {
  return Mk_g + psi2 * Mk_q;
}
