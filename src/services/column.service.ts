/**
 * Column Design Service
 */

import { ColumnDesignInput } from "@/lib/schemas/column.schema";
import { MaterialService } from "./material.service";
import {
  calculateColumnDesign,
  ColumnDesignResult,
  ColumnDesignParams,
} from "@/core/design/ColumnDesign";

export class ColumnService {
  /**
   * Calculate column design from validated input
   */
  static design(input: ColumnDesignInput): ColumnDesignResult {
    // Get material properties
    const concrete = MaterialService.getConcreteProperties(
      input.materials.concrete
    );
    const steel = MaterialService.getPassiveSteelProperties(
      input.materials.steel
    );

    // Build params
    const params: ColumnDesignParams = {
      geometry: {
        bx: input.geometry.bx,
        by: input.geometry.by,
      },
      length: input.length,
      supports: input.supports,
      loading: {
        Nd: input.loading.nd,
        Mx_top: input.loading.mx_top,
        Mx_bot: input.loading.mx_bot,
        My_top: input.loading.my_top,
        My_bot: input.loading.my_bot,
      },
      fck: concrete.fck,
      fyk: steel.fyk,
      cover: input.parameters?.cover ?? 3,
      stirrupDiameter: input.parameters?.stirrupDiameter,
      mainBarDiameter: input.parameters?.mainBarDiameter,
    };

    return calculateColumnDesign(params);
  }
}
