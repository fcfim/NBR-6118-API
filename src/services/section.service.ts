/**
 * Section Service
 *
 * Orchestrates section geometry calculations.
 * Acts as a factory for section instances and handles DTO conversion.
 */

import { SectionInput } from "@/lib/schemas/section.schema";
import {
  Rectangular,
  TSection,
  ISection,
  AbstractSection,
  SectionProperties,
  Point2D,
} from "@/core/sections";
import { toCm } from "@/core/utils/units";

export interface SectionResult {
  type: string;
  properties: SectionProperties;
  points: Point2D[];
}

/**
 * Convert distance input to cm value
 */
function normalizeDistance(input: { value: number; unit: string }): number {
  const factors: Record<string, number> = { mm: 0.1, cm: 1, m: 100 };
  return input.value * (factors[input.unit] || 1);
}

export class SectionService {
  /**
   * Create a section instance from validated input
   */
  static createSectionInstance(input: SectionInput): AbstractSection {
    switch (input.type) {
      case "rectangular":
        return new Rectangular({
          base: normalizeDistance(input.width),
          height: normalizeDistance(input.height),
        });

      case "T":
        return new TSection({
          bf: normalizeDistance(input.bf),
          hf: normalizeDistance(input.hf),
          bw: normalizeDistance(input.bw),
          h: normalizeDistance(input.h),
        });

      case "I":
        return new ISection({
          bf: normalizeDistance(input.bf),
          hf: normalizeDistance(input.hf),
          bw: normalizeDistance(input.bw),
          h: normalizeDistance(input.h),
          bi: normalizeDistance(input.bi),
          hi: normalizeDistance(input.hi),
        });

      default:
        throw new Error(`Unsupported section type: ${(input as any).type}`);
    }
  }

  /**
   * Calculate section properties from input
   */
  static calculateProperties(input: SectionInput): SectionResult {
    const section = this.createSectionInstance(input);

    return {
      type: input.type,
      properties: section.props,
      points: section.points,
    };
  }

  /**
   * Get section width (for effective flange calculations)
   */
  static getSectionWidth(input: SectionInput): number {
    switch (input.type) {
      case "rectangular":
        return normalizeDistance(input.width);
      case "T":
      case "I":
        return normalizeDistance(input.bf);
      default:
        throw new Error("Unknown section type");
    }
  }

  /**
   * Get section height
   */
  static getSectionHeight(input: SectionInput): number {
    switch (input.type) {
      case "rectangular":
        return normalizeDistance(input.height);
      case "T":
      case "I":
        return normalizeDistance(input.h);
      default:
        throw new Error("Unknown section type");
    }
  }

  /**
   * Get web width (for shear calculations)
   */
  static getWebWidth(input: SectionInput): number {
    switch (input.type) {
      case "rectangular":
        return normalizeDistance(input.width);
      case "T":
      case "I":
        return normalizeDistance(input.bw);
      default:
        throw new Error("Unknown section type");
    }
  }
}
