/**
 * Deflection Verification Service
 */

import { DeflectionVerificationInput } from "@/lib/schemas/deflection.schema";
import { SectionService } from "./section.service";
import { MaterialService } from "./material.service";
import {
  calculateDeflection,
  DeflectionResult,
  DeflectionParams,
} from "@/core/verification/DeflectionVerification";

/**
 * Normalize moment to kN.cm
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

/**
 * Normalize span to cm
 */
function normalizeSpan(input: { value: number; unit: string }): number {
  const factors: Record<string, number> = { mm: 0.1, cm: 1, m: 100 };
  return input.value * (factors[input.unit] || 1);
}

export class DeflectionService {
  /**
   * Calculate deflection verification from validated input
   */
  static verifyDeflection(
    input: DeflectionVerificationInput
  ): DeflectionResult {
    // Get section properties
    const sectionResult = SectionService.calculateProperties(input.section);
    const props = sectionResult.properties;

    // Get concrete properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );

    // Normalize inputs
    const Ma = normalizeMoment(input.loading.ma);
    const span = normalizeSpan(input.loading.span);

    // Calculate effective depth if not provided
    const h = props.h;
    const d =
      input.parameters.d ?? h - (input.parameters.concreteCover || 2.5) - 1.3;

    // Build params
    const params: DeflectionParams = {
      span,
      Ic: props.Ix,
      h: props.h,
      b: props.b,
      d,
      yt: props.yc, // distance to centroid from bottom
      Ecs: concrete.Ecs,
      fctm: concrete.fctm,
      Ma,
      rho_prime: input.parameters.rho_prime,
      As: input.parameters.As,
      beamType: input.parameters.beamType,
      loadingDuration: input.parameters.loadingDuration,
    };

    return calculateDeflection(params);
  }
}
