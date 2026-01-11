/**
 * Material Service
 *
 * Retrieves material properties from static tables
 * or calculates them for custom values.
 */

import { MaterialRequest, ConcreteInput } from "@/lib/schemas/material.schema";
import {
  CONCRETE_CLASSES,
  ConcreteProperties,
  calcConcreteProperties,
  AggregateType,
} from "@/data/materials/concrete.data";
import {
  PASSIVE_STEEL_CLASSES,
  ACTIVE_STEEL_CLASSES,
  PassiveSteelProperties,
  ActiveSteelProperties,
} from "@/data/materials/steel.data";

export interface MaterialResult {
  concrete?: ConcreteProperties;
  passiveSteel?: PassiveSteelProperties;
  activeSteel?: ActiveSteelProperties;
}

export class MaterialService {
  /**
   * Get concrete properties from class name or custom fck
   */
  static getConcreteProperties(input: ConcreteInput): ConcreteProperties {
    if (typeof input === "string") {
      // Standard class lookup
      const props = CONCRETE_CLASSES[input];
      if (!props) {
        throw new Error(`Unknown concrete class: ${input}`);
      }
      return props;
    } else {
      // Custom fck calculation
      let fck = input.fck;

      // Convert if needed
      if (input.unit === "kN/cm2") {
        fck = fck * 10; // kN/cm² to MPa
      }

      return calcConcreteProperties(fck, input.aggregate as AggregateType);
    }
  }

  /**
   * Get passive steel properties
   */
  static getPassiveSteelProperties(steelClass: string): PassiveSteelProperties {
    const props = PASSIVE_STEEL_CLASSES[steelClass];
    if (!props) {
      throw new Error(`Unknown steel class: ${steelClass}`);
    }
    return props;
  }

  /**
   * Get active (prestressing) steel properties
   */
  static getActiveSteelProperties(steelClass: string): ActiveSteelProperties {
    const props = ACTIVE_STEEL_CLASSES[steelClass];
    if (!props) {
      throw new Error(`Unknown prestressing steel: ${steelClass}`);
    }
    return props;
  }

  /**
   * Get all requested material properties
   */
  static getProperties(request: MaterialRequest): MaterialResult {
    const result: MaterialResult = {};

    if (request.concrete) {
      result.concrete = this.getConcreteProperties(request.concrete);
    }

    if (request.passiveSteel) {
      result.passiveSteel = this.getPassiveSteelProperties(
        request.passiveSteel
      );
    }

    if (request.activeSteel) {
      result.activeSteel = this.getActiveSteelProperties(request.activeSteel);
    }

    return result;
  }

  /**
   * Get available concrete classes
   */
  static getAvailableConcreteClasses(): string[] {
    return Object.keys(CONCRETE_CLASSES);
  }

  /**
   * Get available steel classes
   */
  static getAvailableSteelClasses(): { passive: string[]; active: string[] } {
    return {
      passive: Object.keys(PASSIVE_STEEL_CLASSES),
      active: Object.keys(ACTIVE_STEEL_CLASSES),
    };
  }
}
