/**
 * Anchorage API Route
 *
 * POST /api/v1/detailing/anchorage
 *
 * Calculates anchorage and splice lengths per NBR 6118:2023.
 *
 * @example
 * {
 *   "diameter": 16,
 *   "materials": { "concrete": "C25", "steel": "CA-50" },
 *   "configuration": { "barType": "ribbed", "bondZone": "good", "anchorageType": "hook_90" },
 *   "splice": { "percentage": 50, "spacing": 8 }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { AnchorageSchema } from "@/lib/schemas/anchorage.schema";
import { AnchorageService } from "@/services/anchorage.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = AnchorageSchema.parse(body);

    // Calculate anchorage
    const result = AnchorageService.calculate(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de ancoragem inválidos",
          details: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Erro interno de cálculo";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/detailing/anchorage",
    method: "POST",
    description:
      "Calcula comprimentos de ancoragem e emenda conforme NBR 6118:2023",
    formulas: {
      lb: "(φ/4) × (fyd/fbd) - Comprimento básico",
      fbd: "η1 × η2 × η3 × fctd - Tensão de aderência",
      lb_nec: "α × lb × (As,calc/As,ef) - Comprimento necessário",
      l0: "α × lb,nec - Comprimento de emenda",
    },
    coefficients: {
      eta1: {
        smooth: 1.0,
        notched: 1.4,
        ribbed: 2.25,
      },
      eta2: {
        good: 1.0,
        poor: 0.7,
      },
      alpha: {
        straight: 1.0,
        hook: 0.7,
      },
    },
    example: {
      diameter: 16,
      materials: { concrete: "C25", steel: "CA-50" },
      configuration: {
        barType: "ribbed",
        bondZone: "good",
        anchorageType: "hook_90",
      },
      splice: {
        percentage: 50,
        spacing: 8,
      },
    },
  });
}
