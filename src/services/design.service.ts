/**
 * Reinforced Concrete Design Service
 *
 * Calculates longitudinal reinforcement for beams according to NBR 6118:2023.
 *
 * ## Design Method (Flexure)
 *
 * Based on the rectangular stress block method:
 *
 * 1. Calculate design moment: Md = γf × Mk
 * 2. Calculate μ: μ = Md / (b × d² × αc × fcd)
 * 3. Check domain limits (ductile failure)
 * 4. Calculate ξ (neutral axis position): ξ = 1 - √(1 - 2μ)
 * 5. Calculate required steel: As = Md / (fyd × (d - 0.5 × λ × ξ × d))
 * 6. Check minimum steel
 */

import { LongitudinalDesignInput } from "@/lib/schemas/design.schema";
import { SectionService } from "./section.service";
import { MaterialService } from "./material.service";
import {
  rebarArea,
  rebarsNeeded,
  REBAR_DIAMETERS,
} from "@/data/materials/steel.data";

export interface LongitudinalDesignResult {
  /** Input summary */
  inputs: {
    b: number; // Section width (cm)
    h: number; // Section height (cm)
    d: number; // Effective depth (cm)
    Mk: number; // Characteristic moment (kN.cm)
    Md: number; // Design moment (kN.cm)
    fck: number; // Concrete strength (MPa)
    fyk: number; // Steel yield strength (MPa)
  };
  /** Design parameters */
  parameters: {
    mu: number; // Dimensionless moment
    mu_limit: number; // Limit for single reinforcement
    xi: number; // Neutral axis ratio (x/d)
    xi_limit: number; // Limit for ductile failure
    x: number; // Neutral axis position (cm)
    z: number; // Lever arm (cm)
    domain: string; // Deformation domain
  };
  /** Reinforcement results */
  reinforcement: {
    As_calc: number; // Calculated steel area (cm²)
    As_min: number; // Minimum steel area (cm²)
    As_required: number; // Required steel area (max of calc and min) (cm²)
    As_compression?: number; // Compression steel if needed (cm²)
    rho: number; // Reinforcement ratio (%)
    rho_min: number; // Minimum ratio (%)
    rho_max: number; // Maximum ratio (%)
  };
  /** Suggested rebar arrangement */
  suggestions: {
    diameter: number; // Suggested bar diameter (mm)
    quantity: number; // Number of bars
    As_provided: number; // Provided area (cm²)
    layer: string; // Layer description
  }[];
  /** Status and warnings */
  status: {
    isValid: boolean;
    isDuctile: boolean;
    needsCompression: boolean;
    messages: string[];
  };
}

/**
 * Convert moment to kN.cm
 */
function normalizeMoment(input: { value: number; unit: string }): number {
  const factors: Record<string, number> = {
    "kN.cm": 1,
    "kN.m": 100,
    "tf.m": 980.665,
    "kgf.m": 0.980665,
  };
  return input.value * (factors[input.unit] || 1);
}

export class DesignService {
  /**
   * Calculate effective depth (d) from section height and cover
   */
  static calculateEffectiveDepth(
    h: number,
    params: {
      d?: number;
      concreteCover?: number;
      stirrupDiameter?: number;
      mainBarDiameter?: number;
      unit?: string;
    }
  ): number {
    if (params.d !== undefined) {
      return params.unit === "mm" ? params.d / 10 : params.d;
    }

    const cover = params.concreteCover || 3; // default 3cm
    const stirrup = (params.stirrupDiameter || 5) / 10; // mm to cm
    const mainBar = (params.mainBarDiameter || 12.5) / 10; // mm to cm
    const coverCm = params.unit === "mm" ? cover / 10 : cover;

    return h - coverCm - stirrup - mainBar / 2;
  }

  /**
   * Calculate minimum reinforcement ratio per NBR 6118:2023 (Table 17.3)
   */
  static calculateRhoMin(fck: number): number {
    // ρmin depends on fck, approximately 0.15% for common cases
    // Table 17.3 gives values from 0.150% to 0.230% for C20-C50
    if (fck <= 25) return 0.15;
    if (fck <= 30) return 0.15;
    if (fck <= 35) return 0.164;
    if (fck <= 40) return 0.179;
    if (fck <= 45) return 0.194;
    if (fck <= 50) return 0.208;
    if (fck <= 55) return 0.211;
    if (fck <= 60) return 0.219;
    if (fck <= 70) return 0.233;
    if (fck <= 80) return 0.245;
    return 0.256;
  }

  /**
   * Calculate xi limit for ductile failure (Domain 3 limit)
   * Based on strain compatibility: εs = 10‰, εcu = 3.5‰ (for fck ≤ 50)
   */
  static calculateXiLimit(fck: number, fyk: number, Es: number): number {
    // εyd (yield strain)
    const fyd = fyk / 1.15;
    const epsilon_yd = fyd / (Es * 1000); // Es in GPa, result in decimal

    // εcu (ultimate concrete strain)
    const epsilon_cu =
      fck <= 50 ? 0.0035 : 0.0026 + 0.035 * Math.pow((90 - fck) / 100, 4);

    // ξlim = εcu / (εcu + εyd + 0.002) for ductile design
    // Simplified: for CA-50, ξlim ≈ 0.45 (ensuring adequate ductility)
    const epsilon_su = 0.01; // 10‰ for steel
    const xi_limit = epsilon_cu / (epsilon_cu + epsilon_su);

    return Math.min(xi_limit, 0.45); // Conservative limit
  }

  /**
   * Calculate longitudinal reinforcement
   */
  static calculateLongitudinalSteel(
    input: LongitudinalDesignInput
  ): LongitudinalDesignResult {
    // Get section properties
    const b = SectionService.getWebWidth(input.section); // For rectangular, it's width
    const h = SectionService.getSectionHeight(input.section);

    // Calculate effective depth
    const d = this.calculateEffectiveDepth(h, input.parameters);

    // Get material properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );
    const steel = MaterialService.getPassiveSteelProperties(
      input.materials.steel
    );

    // Convert concrete properties to kN/cm² for calculations
    const fcd = concrete.fcd / 10; // MPa to kN/cm²
    const fyd = steel.fyd / 10; // MPa to kN/cm²

    // Get stress block parameters
    const alpha_c = concrete.alpha_c;
    const lambda = concrete.lambda;

    // Calculate moments
    const Mk = normalizeMoment(input.loading.mk);
    const gamma_f = input.loading.gamma_f;
    const Md = Mk * gamma_f;

    // Calculate dimensionless moment (μ)
    const mu = Md / (b * Math.pow(d, 2) * alpha_c * fcd);

    // Calculate limits
    const xi_limit = this.calculateXiLimit(concrete.fck, steel.fyk, steel.Es);
    const mu_limit = lambda * xi_limit * (1 - 0.5 * lambda * xi_limit);

    // Check if compression steel is needed
    const needsCompression = mu > mu_limit;

    let xi: number;
    let As_calc: number;
    let As_compression = 0;
    let domain: string;
    const messages: string[] = [];

    if (needsCompression) {
      // Double reinforcement needed
      xi = xi_limit;
      const z = d * (1 - 0.5 * lambda * xi);

      // Moment resisted by single reinforcement at limit
      const Md_limit = mu_limit * b * Math.pow(d, 2) * alpha_c * fcd;

      // Tension steel for balanced section
      const As1 = Md_limit / (fyd * z);

      // Additional moment
      const delta_Md = Md - Md_limit;

      // Assume compression steel at d' = 0.1d
      const d_prime = 0.1 * d;
      const As2 = delta_Md / (fyd * (d - d_prime));

      As_calc = As1 + As2;
      As_compression = As2;
      domain = "Domínio 3 (armadura dupla)";
      messages.push("⚠️ Armadura dupla necessária");
      messages.push(`Armadura de compressão: ${As_compression.toFixed(2)} cm²`);
    } else {
      // Single reinforcement
      xi = (1 - Math.sqrt(1 - 2 * mu)) / lambda;
      const z = d * (1 - 0.5 * lambda * xi);
      As_calc = Md / (fyd * z);

      // Determine domain
      if (xi < 0.259) {
        domain = "Domínio 2";
      } else {
        domain = "Domínio 3";
      }
    }

    // Calculate minimum steel
    const rho_min = this.calculateRhoMin(concrete.fck) / 100;
    const As_min = rho_min * b * h;

    // Maximum steel (4% of gross area per NBR 6118)
    const rho_max = 0.04;
    const As_max = rho_max * b * h;

    // Required steel
    const As_required = Math.max(As_calc, As_min);
    const rho = (As_required / (b * h)) * 100;

    // Check validity
    const isValid = As_required <= As_max;
    const isDuctile = xi <= xi_limit;

    if (!isValid) {
      messages.push("❌ Armadura excede limite máximo (4%)");
    }
    if (As_calc < As_min) {
      messages.push("ℹ️ Armadura mínima governa");
    }
    if (isDuctile && !needsCompression) {
      messages.push("✅ Ruptura dúctil garantida");
    }

    // Suggest rebar arrangement
    const suggestions = this.suggestRebars(As_required, steel.category);

    return {
      inputs: {
        b,
        h,
        d,
        Mk,
        Md,
        fck: concrete.fck,
        fyk: steel.fyk,
      },
      parameters: {
        mu,
        mu_limit,
        xi,
        xi_limit,
        x: xi * d,
        z: d * (1 - 0.5 * lambda * xi),
        domain,
      },
      reinforcement: {
        As_calc,
        As_min,
        As_required,
        As_compression: needsCompression ? As_compression : undefined,
        rho,
        rho_min: rho_min * 100,
        rho_max: rho_max * 100,
      },
      suggestions,
      status: {
        isValid,
        isDuctile,
        needsCompression,
        messages,
      },
    };
  }

  /**
   * Suggest practical rebar arrangement
   */
  static suggestRebars(
    As_required: number,
    steelCategory: string
  ): LongitudinalDesignResult["suggestions"] {
    const diameters = REBAR_DIAMETERS[
      steelCategory as keyof typeof REBAR_DIAMETERS
    ] || [10, 12.5, 16, 20, 25];
    const suggestions: LongitudinalDesignResult["suggestions"] = [];

    // Find best diameter (not too many bars, not too few)
    for (const diameter of diameters) {
      const quantity = rebarsNeeded(As_required, diameter);

      // Skip if too many bars (more than 8) or too few (less than 2)
      if (quantity >= 2 && quantity <= 8) {
        const As_provided = quantity * rebarArea(diameter);
        suggestions.push({
          diameter,
          quantity,
          As_provided,
          layer: quantity <= 4 ? "1 camada" : "2 camadas",
        });
      }
    }

    // If no good option, suggest largest diameter with minimal count
    if (suggestions.length === 0) {
      const diameter = diameters[diameters.length - 1];
      const quantity = Math.max(2, rebarsNeeded(As_required, diameter));
      suggestions.push({
        diameter,
        quantity,
        As_provided: quantity * rebarArea(diameter),
        layer: quantity <= 4 ? "1 camada" : "múltiplas camadas",
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
}
