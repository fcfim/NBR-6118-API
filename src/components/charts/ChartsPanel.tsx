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
  const showShearDiagram = activeModule === "beam-shear" && data?.stirrups;
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-slate-900">Visualização Gráfica</h2>
        <p className="text-sm text-slate-500">
          Diagramas e representações visuais
        </p>
      </div>

      <div className="p-8">
        <div className="flex flex-wrap justify-center gap-8">
          {/* Section Visualizer */}
          {showSectionVisualizer && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[400px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
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
                  width={380}
                  height={320}
                  showGrid={true}
                  showDimensions={true}
                />
              </div>
            </div>
          )}

          {/* Strain Diagram - Flexure */}
          {showStrainDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[480px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
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
                  width={450}
                  height={320}
                />
              </div>
            </div>
          )}

          {/* Punching Diagram */}
          {showPunchingDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[420px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
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
                  width={400}
                  height={340}
                />
              </div>
            </div>
          )}

          {/* Shear Truss Diagram */}
          {showShearDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[480px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Treliça de Mörsch (Modelo I)
              </p>
              <div className="flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 400 160"
                  className="w-full max-w-[420px] h-auto"
                  fill="none"
                >
                  {/* Beam outline */}
                  <rect
                    x="20"
                    y="20"
                    width="360"
                    height="120"
                    fill="#f1f5f9"
                    stroke="#64748b"
                    strokeWidth="2"
                  />

                  {/* Top chord (compressed concrete) */}
                  <line
                    x1="20"
                    y1="35"
                    x2="380"
                    y2="35"
                    stroke="#3b82f6"
                    strokeWidth="4"
                  />
                  <text x="390" y="40" fontSize="10" fill="#3b82f6">
                    Rc
                  </text>

                  {/* Bottom chord (steel reinforcement) */}
                  <line
                    x1="20"
                    y1="125"
                    x2="380"
                    y2="125"
                    stroke="#ef4444"
                    strokeWidth="4"
                  />
                  <text x="390" y="130" fontSize="10" fill="#ef4444">
                    Rs
                  </text>

                  {/* Diagonal struts (concrete) - 45° */}
                  {[60, 120, 180, 240, 300].map((x, i) => (
                    <line
                      key={`strut-${i}`}
                      x1={x}
                      y1="35"
                      x2={x + 50}
                      y2="125"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="5,3"
                    />
                  ))}

                  {/* Vertical stirrups */}
                  {[80, 140, 200, 260, 320].map((x, i) => (
                    <g key={`stirrup-${i}`}>
                      <line
                        x1={x}
                        y1="35"
                        x2={x}
                        y2="125"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                      <circle cx={x} cy="35" r="4" fill="#10b981" />
                      <circle cx={x} cy="125" r="4" fill="#10b981" />
                    </g>
                  ))}

                  {/* Load arrows */}
                  <polygon points="200,5 195,15 205,15" fill="#1e293b" />
                  <line
                    x1="200"
                    y1="15"
                    x2="200"
                    y2="0"
                    stroke="#1e293b"
                    strokeWidth="2"
                  />
                  <text x="210" y="12" fontSize="10" fill="#1e293b">
                    Vsd
                  </text>

                  {/* Angle annotation */}
                  <path
                    d="M 240,125 L 260,125 A 20,20 0 0 0 250,110"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <text x="265" y="115" fontSize="9" fill="#64748b">
                    θ=45°
                  </text>
                </svg>

                <div className="flex gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500 rounded"></div>
                    <span className="text-slate-600">Banzo comprimido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-500 rounded"></div>
                    <span className="text-slate-600">Banzo tracionado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-emerald-500 rounded"></div>
                    <span className="text-slate-600">Estribos</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mt-3">
                  Vsd ={" "}
                  {(
                    (data.inputs as Record<string, unknown>)?.Vsd as number
                  )?.toFixed(1) || "?"}{" "}
                  kN
                </p>
              </div>
            </div>
          )}

          {/* Deflection Curve */}
          {showDeflectionDiagram && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-w-[480px]">
              <p className="text-sm font-medium text-slate-700 mb-4 text-center">
                Curva de Flecha
              </p>
              <div className="flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 400 140"
                  className="w-full max-w-[420px] h-auto"
                  fill="none"
                >
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={`grid-${i}`}
                      x1={50 + i * 75}
                      y1="30"
                      x2={50 + i * 75}
                      y2="110"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Supports */}
                  <polygon points="50,50 60,70 40,70" fill="#64748b" />
                  <polygon points="350,50 360,70 340,70" fill="#64748b" />
                  <line
                    x1="30"
                    y1="70"
                    x2="70"
                    y2="70"
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                  <line
                    x1="330"
                    y1="70"
                    x2="370"
                    y2="70"
                    stroke="#64748b"
                    strokeWidth="2"
                  />

                  {/* Original beam (undeformed) */}
                  <line
                    x1="50"
                    y1="50"
                    x2="350"
                    y2="50"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="8,4"
                  />

                  {/* Deflected beam (curved) */}
                  <path
                    d="M 50,50 C 100,50 150,90 200,95 C 250,90 300,50 350,50"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    fill="none"
                  />

                  {/* Max deflection point */}
                  <circle cx="200" cy="95" r="5" fill="#ef4444" />

                  {/* Deflection arrow */}
                  <line
                    x1="200"
                    y1="50"
                    x2="200"
                    y2="90"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <polygon points="200,95 195,85 205,85" fill="#ef4444" />

                  {/* Deflection value */}
                  <text
                    x="210"
                    y="75"
                    fontSize="12"
                    fill="#ef4444"
                    fontWeight="bold"
                  >
                    f ={" "}
                    {(
                      (data.deflection as Record<string, unknown>)
                        ?.total as number
                    )?.toFixed(2) || "?"}{" "}
                    cm
                  </text>

                  {/* Span dimension */}
                  <line
                    x1="50"
                    y1="120"
                    x2="350"
                    y2="120"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <line
                    x1="50"
                    y1="115"
                    x2="50"
                    y2="125"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <line
                    x1="350"
                    y1="115"
                    x2="350"
                    y2="125"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <text x="190" y="135" fontSize="10" fill="#64748b">
                    L = vão
                  </text>
                </svg>

                <div className="flex gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-slate-400 border-dashed"></div>
                    <span className="text-slate-600">Posição inicial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500 rounded"></div>
                    <span className="text-slate-600">Viga deformada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-slate-600">Flecha máxima</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartsPanel;
