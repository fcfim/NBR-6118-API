/**
 * Longitudinal Reinforcement Design API Route
 *
 * POST /api/v1/beam/design/reinforced-concrete/longitudinal
 *
 * Calculates longitudinal reinforcement for beams per NBR 6118:2023.
 *
 * @example
 * {
 *   "section": { "type": "rectangular", "width": 20, "height": 50 },
 *   "materials": { "concrete": "C25", "steel": "CA-50" },
 *   "loading": { "mk": { "value": 45, "unit": "kN.m" } },
 *   "parameters": { "concreteCover": 2.5 }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { LongitudinalDesignSchema } from "@/lib/schemas/design.schema";
import { DesignService } from "@/services/design.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = LongitudinalDesignSchema.parse(body);

    // Calculate reinforcement
    const result = DesignService.calculateLongitudinalSteel(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de dimensionamento inválidos",
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
    endpoint: "/api/v1/beam/design/reinforced-concrete/longitudinal",
    method: "POST",
    description:
      "Dimensiona armadura longitudinal de vigas conforme NBR 6118:2023",
    example: {
      section: {
        type: "rectangular",
        width: 20,
        height: 50,
      },
      materials: {
        concrete: "C25",
        steel: "CA-50",
      },
      loading: {
        mk: { value: 45, unit: "kN.m" },
        gamma_f: 1.4,
      },
      parameters: {
        concreteCover: 2.5,
        unit: "cm",
      },
    },
    outputs: {
      reinforcement: {
        As_required: "Área de aço necessária (cm²)",
        As_min: "Área mínima (cm²)",
        rho: "Taxa de armadura (%)",
      },
      parameters: {
        mu: "Momento adimensional",
        xi: "Posição relativa da linha neutra (x/d)",
        domain: "Domínio de deformação",
      },
      suggestions: "Sugestões de detalhamento (diâmetro e quantidade)",
    },
  });
}
