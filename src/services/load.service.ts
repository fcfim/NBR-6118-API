/**
 * Load Service
 *
 * Calculates load combinations according to NBR 6118:2023.
 * Supports ELU (Ultimate Limit State) and ELS (Serviceability Limit State).
 */

import { SimpleBeamLoadInput } from "@/lib/schemas/load.schema";
import {
  BUILDING_TYPES,
  SAFETY_FACTORS,
  GammaFactors,
} from "@/data/loads/coefficients.data";

export interface LoadCombinationResult {
  /** Metadata about coefficients used */
  metadata: {
    psi0: number;
    psi1: number;
    psi2: number;
    gamma_g: number;
    gamma_q: number;
    buildingType?: string;
    combinationType: string;
  };
  /** Characteristic loads (unfactored) */
  characteristic: {
    g_total: number; // Total permanent load
    q: number; // Variable load
    unit: string;
  };
  /** Calculated moments (kN.cm) */
  moments: {
    /** Ultimate limit state moment (Md) */
    Md: number;
    /** Rare combination moment */
    Mk_rare: number;
    /** Frequent combination moment */
    Mk_frequent: number;
    /** Quasi-permanent combination moment */
    Mk_quasiPermanent: number;
    unit: string;
  };
  /** Equivalent distributed loads */
  loads: {
    /** ELU distributed load */
    pd: number;
    /** ELS rare distributed load */
    p_rare: number;
    /** ELS frequent distributed load */
    p_frequent: number;
    /** ELS quasi-permanent distributed load */
    p_quasiPermanent: number;
    unit: string;
  };
}

/**
 * Convert load value to kN/cm
 */
function normalizeLoad(input: { value: number; unit: string }): number {
  const factors: Record<string, number> = {
    "kN/m": 0.01,
    "kN/cm": 1,
    "tf/m": 0.0980665,
    "kgf/m": 0.0000980665,
  };
  return input.value * (factors[input.unit] || 0.01);
}

/**
 * Convert span to cm
 */
function normalizeSpan(input: { value: number; unit: string }): number {
  const factors: Record<string, number> = { mm: 0.1, cm: 1, m: 100 };
  return input.value * (factors[input.unit] || 1);
}

export class LoadService {
  /**
   * Get psi factors from building type or manual input
   */
  static getPsiFactors(params: {
    buildingType?: string;
    psi0?: number;
    psi1?: number;
    psi2?: number;
  }): { psi0: number; psi1: number; psi2: number } {
    let psi0 = params.psi0;
    let psi1 = params.psi1;
    let psi2 = params.psi2;

    if (params.buildingType) {
      const defaults = BUILDING_TYPES[params.buildingType];
      if (defaults) {
        if (psi0 === undefined) psi0 = defaults.psi0;
        if (psi1 === undefined) psi1 = defaults.psi1;
        if (psi2 === undefined) psi2 = defaults.psi2;
      }
    }

    return {
      psi0: psi0 ?? 0.5,
      psi1: psi1 ?? 0.4,
      psi2: psi2 ?? 0.3,
    };
  }

  /**
   * Get gamma factors from combination type or manual input
   */
  static getGammaFactors(params: {
    combinationType?: string;
    gamma_g?: number;
    gamma_q?: number;
  }): GammaFactors {
    const combinationType = params.combinationType || "NORMAL";
    const defaults = SAFETY_FACTORS[combinationType] || SAFETY_FACTORS.NORMAL;

    return {
      gamma_g: params.gamma_g ?? defaults.gamma_g,
      gamma_q: params.gamma_q ?? defaults.gamma_q,
      label: defaults.label,
    };
  }

  /**
   * Calculate simply supported beam moment from distributed load
   * M = q * L² / 8
   */
  static calculateSimpleBeamMoment(
    load_kN_cm: number,
    span_cm: number,
  ): number {
    return (load_kN_cm * Math.pow(span_cm, 2)) / 8;
  }

  /**
   * Calculate load combinations
   */
  static calculateCombinations(
    input: SimpleBeamLoadInput,
  ): LoadCombinationResult {
    const { span, loads, parameters } = input;

    // Normalize inputs
    const L = normalizeSpan(span);
    const g1 = normalizeLoad(loads.g1);
    const g2 = loads.g2 ? normalizeLoad(loads.g2) : 0;
    const q = normalizeLoad(loads.q);
    const g_total = g1 + g2;

    // Get coefficients
    const psi = this.getPsiFactors(parameters);
    const gamma = this.getGammaFactors(parameters);

    // NBR 6118:2023 Item 11.8 - Load combinations
    // ELU: Fd = γg × Σ(Fg) + γq × [Fq1 + Σ(ψ0j × Fqj)]
    // When permanent is favorable, γg_fav = 1.0 (NBR Table 11.1)
    const gamma_g_eff = parameters.permanentFavorable ? 1.0 : gamma.gamma_g;

    // Support for secondary variable loads
    // NBR 6118:2023 Item 11.8: ψ factors applied per combination type
    const q_sec_raw = loads.q_secondary ? normalizeLoad(loads.q_secondary) : 0;

    // Calculate distributed loads for each combination
    // ELU: secondary reduced by ψ₀
    const pd =
      gamma_g_eff * g_total + gamma.gamma_q * (q + psi.psi0 * q_sec_raw);
    // ELS Rare: all variable loads at full characteristic value (no ψ reduction).
    // q_secondary is treated as an independent variable action, applied at its
    // full characteristic value alongside the principal action (NBR 6118:2023 Item 11.8).
    const p_rare = g_total + q + q_sec_raw;
    // ELS Frequent: principal × ψ₁, secondary × ψ₂
    const p_frequent = g_total + psi.psi1 * q + psi.psi2 * q_sec_raw;
    // ELS Quasi-permanent: all variables × ψ₂
    const p_quasiPermanent = g_total + psi.psi2 * q + psi.psi2 * q_sec_raw;

    // Calculate moments
    const Md = this.calculateSimpleBeamMoment(pd, L);
    const Mk_rare = this.calculateSimpleBeamMoment(p_rare, L);
    const Mk_frequent = this.calculateSimpleBeamMoment(p_frequent, L);
    const Mk_quasiPermanent = this.calculateSimpleBeamMoment(
      p_quasiPermanent,
      L,
    );

    return {
      metadata: {
        psi0: psi.psi0,
        psi1: psi.psi1,
        psi2: psi.psi2,
        gamma_g: gamma.gamma_g,
        gamma_q: gamma.gamma_q,
        buildingType: parameters.buildingType,
        combinationType: parameters.combinationType || "NORMAL",
      },
      characteristic: {
        g_total: g_total * 100, // Convert back to kN/m for display
        q: q * 100,
        unit: "kN/m",
      },
      moments: {
        Md,
        Mk_rare,
        Mk_frequent,
        Mk_quasiPermanent,
        unit: "kN.cm",
      },
      loads: {
        pd: pd * 100,
        p_rare: p_rare * 100,
        p_frequent: p_frequent * 100,
        p_quasiPermanent: p_quasiPermanent * 100,
        unit: "kN/m",
      },
    };
  }
}
