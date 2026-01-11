/**
 * Load Combinations API Route
 *
 * POST /api/v1/loads/calculate
 *
 * Calculates load combinations for ELU and ELS per NBR 6118:2023.
 *
 * @example
 * {
 *   "span": 500,
 *   "loads": { "g1": 15, "q": 5 },
 *   "parameters": { "buildingType": "RESIDENCIAL" }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { SimpleBeamLoadSchema } from "@/lib/schemas/load.schema";
import { LoadService } from "@/services/load.service";
import {
  BUILDING_TYPE_NAMES,
  SAFETY_FACTOR_NAMES,
} from "@/data/loads/coefficients.data";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = SimpleBeamLoadSchema.parse(body);

    // Calculate combinations
    const result = LoadService.calculateCombinations(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de carregamento inválidos",
          details: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/loads/calculate",
    method: "POST",
    description:
      "Calcula combinações de cargas para ELU e ELS conforme NBR 6118:2023",
    buildingTypes: BUILDING_TYPE_NAMES,
    combinationTypes: SAFETY_FACTOR_NAMES,
    example: {
      span: { value: 5, unit: "m" },
      loads: {
        g1: { value: 15, unit: "kN/m" },
        q: { value: 5, unit: "kN/m" },
      },
      parameters: {
        buildingType: "RESIDENCIAL",
      },
    },
  });
}
