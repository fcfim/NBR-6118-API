/**
 * Column Design API Route
 *
 * POST /api/v1/column/design
 *
 * Designs column reinforcement considering slenderness and 2nd order effects.
 *
 * @example
 * {
 *   "geometry": { "bx": 20, "by": 40 },
 *   "length": { "value": 3, "unit": "m" },
 *   "supports": { "top": "fixed", "bottom": "fixed" },
 *   "materials": { "concrete": "C30", "steel": "CA-50" },
 *   "loading": { "nd": 1200, "mx_top": 500, "mx_bot": 300 }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { ColumnDesignSchema } from "@/lib/schemas/column.schema";
import { ColumnService } from "@/services/column.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = ColumnDesignSchema.parse(body);

    // Calculate column design
    const result = ColumnService.design(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados do pilar inválidos",
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
    endpoint: "/api/v1/column/design",
    method: "POST",
    description: "Dimensiona pilares de concreto armado conforme NBR 6118:2023",
    slendernessLimits: {
      "λ ≤ 40": "Pilar curto - sem efeitos de 2ª ordem",
      "40 < λ ≤ 90": "Pilar médio - método do pilar-padrão",
      "90 < λ ≤ 140": "Pilar esbelto - método geral (simplificado aqui)",
      "λ > 200": "Não permitido pela NBR 6118",
    },
    example: {
      geometry: { bx: 20, by: 40 },
      length: { value: 3, unit: "m" },
      supports: { top: "fixed", bottom: "fixed" },
      materials: { concrete: "C30", steel: "CA-50" },
      loading: {
        nd: 1200,
        mx_top: 500,
        mx_bot: 300,
        my_top: 0,
        my_bot: 0,
      },
      parameters: { cover: 3 },
    },
    outputs: {
      slenderness: {
        lambda: "Índice de esbeltez",
        classification: "Classificação do pilar",
      },
      moments: {
        M1d_min: "Momento mínimo de 1ª ordem",
        e2: "Excentricidade de 2ª ordem",
        Md: "Momento total de cálculo",
      },
      reinforcement: {
        nu: "Força normal adimensional",
        omega: "Taxa mecânica de armadura",
        As: "Área de aço necessária (cm²)",
      },
    },
  });
}
