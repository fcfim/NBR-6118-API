"use client";

import React from "react";

interface StrainDiagramProps {
  /** Neutral axis position (cm) */
  x: number;
  /** Effective depth (cm) */
  d: number;
  /** Section height (cm) */
  h: number;
  /** Section width (cm) */
  b: number;
  /** Neutral axis ratio (x/d) */
  xi: number;
  /** Deformation domain */
  domain: string;
  /** SVG width */
  width?: number;
  /** SVG height */
  height?: number;
  className?: string;
}

/**
 * Strain Diagram Component
 *
 * Visualizes the strain distribution across a beam cross-section
 * Shows εc (concrete compression) and εs (steel tension)
 */
export function StrainDiagram({
  x,
  d,
  h,
  b,
  xi,
  domain,
  width = 400,
  height = 300,
  className = "",
}: StrainDiagramProps) {
  // Diagram layout
  const sectionWidth = width * 0.25;
  const diagramWidth = width * 0.45;
  const padding = 20;
  const sectionX = padding;
  const diagramX = sectionX + sectionWidth + 40;

  // Scale section to fit
  const scale = (height - 2 * padding) / h;
  const sectionH = h * scale;
  const sectionW = Math.min(sectionWidth - 10, b * scale);
  const sectionCenterX = sectionX + sectionWidth / 2;

  // Neutral axis position (from top)
  const naY = padding + x * scale;
  const dY = padding + d * scale;

  // Strain values per NBR 6118
  const epsilonCu = 3.5; // ‰ (concrete ultimate strain)
  const epsilonS = xi > 0 ? (epsilonCu * (d - x)) / x : 10; // ‰ (steel strain)
  const limitedEpsilonS = Math.min(epsilonS, 10); // Cap at 10‰ for display

  // Diagram scaling
  const maxStrain = Math.max(epsilonCu, limitedEpsilonS, 10);
  const strainScale = diagramWidth / maxStrain;

  // Colors based on domain
  const concreteColor = "#3b82f6"; // blue
  const steelColor = "#ef4444"; // red
  const naColor = "#22c55e"; // green

  return (
    <svg
      width={width}
      height={height}
      className={`bg-white rounded-lg border border-slate-200 ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Title */}
      <text
        x={width / 2}
        y={15}
        textAnchor="middle"
        className="text-xs font-medium fill-slate-700"
      >
        Diagrama de Deformações - {domain}
      </text>

      {/* Section Rectangle */}
      <rect
        x={sectionCenterX - sectionW / 2}
        y={padding}
        width={sectionW}
        height={sectionH}
        className="fill-slate-100 stroke-slate-400"
        strokeWidth="2"
      />

      {/* Neutral axis line on section */}
      <line
        x1={sectionCenterX - sectionW / 2 - 10}
        y1={naY}
        x2={sectionCenterX + sectionW / 2 + 10}
        y2={naY}
        stroke={naColor}
        strokeWidth="2"
        strokeDasharray="5,3"
      />

      {/* Steel position (at d) */}
      <circle cx={sectionCenterX} cy={dY} r="4" className="fill-red-500" />

      {/* Labels for section */}
      <text
        x={sectionCenterX - sectionW / 2 - 15}
        y={padding + 10}
        textAnchor="end"
        className="text-[10px] fill-slate-500"
      >
        0
      </text>
      <text
        x={sectionCenterX - sectionW / 2 - 15}
        y={naY + 4}
        textAnchor="end"
        className="text-[10px] fill-green-600 font-medium"
      >
        x={x.toFixed(1)}
      </text>
      <text
        x={sectionCenterX - sectionW / 2 - 15}
        y={dY + 4}
        textAnchor="end"
        className="text-[10px] fill-red-500"
      >
        d={d.toFixed(1)}
      </text>
      <text
        x={sectionCenterX - sectionW / 2 - 15}
        y={padding + sectionH}
        textAnchor="end"
        className="text-[10px] fill-slate-500"
      >
        h={h.toFixed(0)}
      </text>

      {/* Strain Diagram */}
      {/* Compression zone (above NA) */}
      <polygon
        points={`
          ${diagramX},${padding}
          ${diagramX + epsilonCu * strainScale},${padding}
          ${diagramX},${naY}
        `}
        fill={concreteColor}
        fillOpacity="0.3"
        stroke={concreteColor}
        strokeWidth="2"
      />

      {/* Tension zone (below NA) */}
      <polygon
        points={`
          ${diagramX},${naY}
          ${diagramX},${dY}
          ${diagramX + limitedEpsilonS * strainScale},${dY}
        `}
        fill={steelColor}
        fillOpacity="0.3"
        stroke={steelColor}
        strokeWidth="2"
      />

      {/* Neutral axis on diagram */}
      <line
        x1={diagramX - 10}
        y1={naY}
        x2={diagramX + diagramWidth}
        y2={naY}
        stroke={naColor}
        strokeWidth="1.5"
        strokeDasharray="5,3"
      />

      {/* Vertical reference line */}
      <line
        x1={diagramX}
        y1={padding}
        x2={diagramX}
        y2={dY + 20}
        stroke="#94a3b8"
        strokeWidth="1"
      />

      {/* Strain values */}
      <text
        x={diagramX + epsilonCu * strainScale + 5}
        y={padding + 15}
        className="text-[10px] fill-blue-600 font-medium"
      >
        εc = {epsilonCu.toFixed(1)}‰
      </text>
      <text
        x={diagramX + limitedEpsilonS * strainScale + 5}
        y={dY + 4}
        className="text-[10px] fill-red-600 font-medium"
      >
        εs = {limitedEpsilonS.toFixed(1)}‰
      </text>

      {/* LN label */}
      <text
        x={diagramX + diagramWidth + 5}
        y={naY + 4}
        className="text-[10px] fill-green-600 font-medium"
      >
        LN
      </text>

      {/* Legend */}
      <g transform={`translate(${padding}, ${height - 25})`}>
        <rect
          x="0"
          y="0"
          width="10"
          height="10"
          fill={concreteColor}
          fillOpacity="0.5"
        />
        <text x="15" y="9" className="text-[9px] fill-slate-600">
          Concreto (compressão)
        </text>

        <rect
          x="120"
          y="0"
          width="10"
          height="10"
          fill={steelColor}
          fillOpacity="0.5"
        />
        <text x="135" y="9" className="text-[9px] fill-slate-600">
          Aço (tração)
        </text>

        <line
          x1="240"
          y1="5"
          x2="260"
          y2="5"
          stroke={naColor}
          strokeWidth="2"
          strokeDasharray="4,2"
        />
        <text x="265" y="9" className="text-[9px] fill-slate-600">
          LN (ξ={xi.toFixed(3)})
        </text>
      </g>
    </svg>
  );
}

export default StrainDiagram;
