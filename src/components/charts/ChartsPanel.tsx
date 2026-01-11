"use client";

import { SectionVisualizer } from "@/components/sections/SectionVisualizer";
import { StrainDiagram } from "@/components/charts/StrainDiagram";
import { PunchingDiagram } from "@/components/charts/PunchingDiagram";

interface ChartsPanelProps {
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  } | null;
  activeModule: string;
}

export function ChartsPanel({ result, activeModule }: ChartsPanelProps) {
  if (!result?.success || !result.data) {
    return null;
  }

  const data = result.data as Record<string, unknown>;
  const points = data?.points as Array<{ x: number; y: number }> | undefined;
  const properties = data?.properties as Record<string, number> | undefined;
  const parameters = data?.parameters as Record<string, unknown> | undefined;
  const inputs = data?.inputs as Record<string, unknown> | undefined;
  const perimeter = data?.perimeter as Record<string, unknown> | undefined;
  const stress = data?.stress as Record<string, number> | undefined;

  // Determine which charts to show based on module and data
  const showSectionVisualizer =
    activeModule === "section" && points && points.length > 0;
  const showStrainDiagram =
    activeModule === "beam-flexure" && parameters?.xi !== undefined;
  const showPunchingDiagram =
    activeModule === "punching" && perimeter && inputs?.pillarType;
  const showShearDiagram = activeModule === "beam-shear" && data?.reinforcement;
  const showDeflectionDiagram =
    activeModule === "deflection" && data?.deflection;

  // If no charts to show, return null
  if (
    !showSectionVisualizer &&
    !showStrainDiagram &&
    !showPunchingDiagram &&
    !showShearDiagram &&
    !showDeflectionDiagram
  ) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-slate-900">Visualização Gráfica</h2>
        <p className="text-sm text-slate-500">
          Diagramas e representações visuais
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Section Visualizer */}
          {showSectionVisualizer && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-3 text-center">
                Geometria da Seção
              </p>
              <div className="flex justify-center">
                <SectionVisualizer
                  points={points}
                  centroid={
                    properties?.xc !== undefined && properties?.yc !== undefined
                      ? { x: properties.xc, y: properties.yc }
                      : undefined
                  }
                  width={280}
                  height={240}
                  showGrid={true}
                  showDimensions={true}
                />
              </div>
            </div>
          )}

          {/* Strain Diagram - Flexure */}
          {showStrainDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-3 text-center">
                Diagrama de Deformações
              </p>
              <div className="flex justify-center">
                <StrainDiagram
                  x={(parameters as Record<string, number>).x}
                  d={(inputs as Record<string, number>)?.d || 45}
                  h={(inputs as Record<string, number>)?.h || 50}
                  b={(inputs as Record<string, number>)?.b || 20}
                  xi={(parameters as Record<string, number>).xi}
                  domain={(parameters as Record<string, string>).domain || ""}
                  width={340}
                  height={240}
                />
              </div>
            </div>
          )}

          {/* Punching Diagram */}
          {showPunchingDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-3 text-center">
                Perímetros de Punção
              </p>
              <div className="flex justify-center">
                <PunchingDiagram
                  a={(inputs as Record<string, number>).a}
                  b={(inputs as Record<string, number>).b}
                  d={(perimeter as Record<string, number>).d}
                  u={(perimeter as Record<string, number>).u}
                  pillarType={
                    (inputs as Record<string, string>).pillarType as
                      | "internal"
                      | "edge"
                      | "corner"
                  }
                  description={
                    (perimeter as Record<string, string>).description
                  }
                  tau_sd={stress?.tau_sd}
                  tau_Rd1={stress?.tau_Rd1}
                  width={300}
                  height={260}
                />
              </div>
            </div>
          )}

          {/* Shear Truss Diagram - Placeholder */}
          {showShearDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-3 text-center">
                Treliça de Mörsch
              </p>
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                <svg
                  viewBox="0 0 200 100"
                  className="w-48 h-24 stroke-current"
                  fill="none"
                  strokeWidth="2"
                >
                  {/* Simple truss representation */}
                  <line
                    x1="10"
                    y1="90"
                    x2="190"
                    y2="90"
                    className="stroke-slate-600"
                  />
                  <line
                    x1="10"
                    y1="10"
                    x2="190"
                    y2="10"
                    className="stroke-slate-600"
                  />
                  {/* Diagonals (stirrups) */}
                  {[30, 70, 110, 150].map((x, i) => (
                    <g key={i}>
                      <line
                        x1={x}
                        y1="10"
                        x2={x + 30}
                        y2="90"
                        className="stroke-blue-500"
                        strokeDasharray="4,2"
                      />
                      <line
                        x1={x}
                        y1="10"
                        x2={x}
                        y2="90"
                        className="stroke-red-500"
                      />
                    </g>
                  ))}
                </svg>
                <p className="text-xs mt-2">
                  θ = 45° | Vsd ={" "}
                  {(
                    (data.reinforcement as Record<string, unknown>)
                      ?.Vsd as number
                  )?.toFixed(1) || "?"}{" "}
                  kN
                </p>
              </div>
            </div>
          )}

          {/* Deflection Curve - Placeholder */}
          {showDeflectionDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-700 mb-3 text-center">
                Curva de Flecha
              </p>
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                <svg viewBox="0 0 200 80" className="w-48 h-20" fill="none">
                  {/* Beam supports */}
                  <polygon points="10,40 20,60 0,60" fill="#64748b" />
                  <polygon points="190,40 200,60 180,60" fill="#64748b" />
                  {/* Deflected beam */}
                  <path
                    d="M 10,40 Q 100,70 190,40"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Original beam */}
                  <line
                    x1="10"
                    y1="40"
                    x2="190"
                    y2="40"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="4,2"
                  />
                  {/* Max deflection arrow */}
                  <line
                    x1="100"
                    y1="40"
                    x2="100"
                    y2="65"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0,0 6,3 0,6" fill="#ef4444" />
                    </marker>
                  </defs>
                </svg>
                <p className="text-xs mt-2">
                  f ={" "}
                  {(
                    (data.deflection as Record<string, unknown>)
                      ?.f_total as number
                  )?.toFixed(2) || "?"}{" "}
                  mm
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartsPanel;
