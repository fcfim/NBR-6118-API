/**
 * Section Properties API Route
 *
 * POST /api/v1/section/properties
 *
 * Calculates geometric properties for cross-sections.
 *
 * @example
 * // Rectangular section
 * { "type": "rectangular", "width": 20, "height": 50 }
 *
 * // T-section with units
 * { "type": "T", "bf": { "value": 60, "unit": "cm" }, "hf": 12, "bw": 20, "h": 50 }
 */

import { NextRequest, NextResponse } from "next/server";
import { SectionInputSchema } from "@/lib/schemas/section.schema";
import { SectionService } from "@/services/section.service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = SectionInputSchema.parse(body);

    // Calculate properties
    const result = SectionService.calculateProperties(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de seção inválidos",
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
    endpoint: "/api/v1/section/properties",
    method: "POST",
    description: "Calcula propriedades geométricas de seções transversais",
    supportedTypes: ["rectangular", "T", "I"],
    example: {
      type: "rectangular",
      width: 20,
      height: 50,
    },
  });
}
