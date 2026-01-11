/**
 * Material Properties API Route
 *
 * POST /api/v1/materials/properties
 *
 * Retrieves material properties from NBR 6118:2023 tables.
 *
 * @example
 * // Standard classes
 * { "concrete": "C25", "passiveSteel": "CA-50" }
 *
 * // Custom fck
 * { "concrete": { "fck": 33, "aggregate": "granite" } }
 */

import { NextRequest, NextResponse } from "next/server";
import { MaterialRequestSchema } from "@/lib/schemas/material.schema";
import { MaterialService } from "@/services/material.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = MaterialRequestSchema.parse(body);

    // Get properties
    const result = MaterialService.getProperties(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de material inválidos",
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
  const availableClasses = MaterialService.getAvailableSteelClasses();

  return NextResponse.json({
    endpoint: "/api/v1/materials/properties",
    method: "POST",
    description: "Consulta propriedades de materiais conforme NBR 6118:2023",
    availableClasses: {
      concrete: MaterialService.getAvailableConcreteClasses(),
      passiveSteel: availableClasses.passive,
      activeSteel: availableClasses.active,
    },
    example: {
      concrete: "C25",
      passiveSteel: "CA-50",
    },
  });
}
