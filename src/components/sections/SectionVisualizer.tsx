"use client";

import React from "react";
import { Point2D } from "@/core/sections/AbstractSection";

interface SectionVisualizerProps {
  points: Point2D[];
  width?: number;
  height?: number;
  centroid?: { x: number; y: number };
  showGrid?: boolean;
  showDimensions?: boolean;
  className?: string;
}

/**
 * SVG-based section visualizer component
 * Renders cross-section polygons from point arrays
 */
export function SectionVisualizer({
  points,
  width = 300,
  height = 300,
  centroid,
  showGrid = true,
  showDimensions = true,
  className = "",
}: SectionVisualizerProps) {
  if (!points || points.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ width, height }}
      >
        <p className="text-muted-foreground text-sm">
          Nenhuma seção para exibir
        </p>
      </div>
    );
  }

  // Calculate bounds
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const sectionWidth = maxX - minX;
  const sectionHeight = maxY - minY;

  // Add padding (20% on each side)
  const padding = 0.2;
  const paddedWidth = sectionWidth * (1 + 2 * padding);
  const paddedHeight = sectionHeight * (1 + 2 * padding);

  // Calculate scale to fit
  const scaleX = width / paddedWidth;
  const scaleY = height / paddedHeight;
  const scale = Math.min(scaleX, scaleY);

  // Transform function (flip Y axis for SVG)
  const transform = (p: Point2D) => ({
    x: (p.x - minX + sectionWidth * padding) * scale,
    y: height - (p.y - minY + sectionHeight * padding) * scale,
  });

  // Create polygon path
  const pathPoints = points
    .map((p) => {
      const tp = transform(p);
      return `${tp.x},${tp.y}`;
    })
    .join(" ");

  // Grid lines
  const gridStep = Math.ceil(Math.max(sectionWidth, sectionHeight) / 5);
  const gridLinesX = [];
  const gridLinesY = [];

  if (showGrid) {
    for (let x = 0; x <= sectionWidth; x += gridStep) {
      const tp1 = transform({ x: minX + x, y: minY });
      const tp2 = transform({ x: minX + x, y: maxY });
      gridLinesX.push({ x1: tp1.x, y1: tp1.y, x2: tp2.x, y2: tp2.y });
    }
    for (let y = 0; y <= sectionHeight; y += gridStep) {
      const tp1 = transform({ x: minX, y: minY + y });
      const tp2 = transform({ x: maxX, y: minY + y });
      gridLinesY.push({ x1: tp1.x, y1: tp1.y, x2: tp2.x, y2: tp2.y });
    }
  }

  // Centroid marker
  const centroidPoint = centroid ? transform(centroid) : null;

  // Dimension labels
  const widthLabel = transform({
    x: minX + sectionWidth / 2,
    y: minY - sectionHeight * 0.1,
  });
  const heightLabel = transform({
    x: minX - sectionWidth * 0.1,
    y: minY + sectionHeight / 2,
  });

  return (
    <svg
      width={width}
      height={height}
      className={`bg-slate-50 dark:bg-slate-900 rounded-lg border ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Grid */}
      {showGrid && (
        <g className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5">
          {gridLinesX.map((line, i) => (
            <line key={`gx-${i}`} {...line} />
          ))}
          {gridLinesY.map((line, i) => (
            <line key={`gy-${i}`} {...line} />
          ))}
        </g>
      )}

      {/* Section polygon */}
      <polygon
        points={pathPoints}
        className="fill-blue-100 dark:fill-blue-900 stroke-blue-600 dark:stroke-blue-400"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Centroid marker */}
      {centroidPoint && (
        <g>
          <circle
            cx={centroidPoint.x}
            cy={centroidPoint.y}
            r="4"
            className="fill-red-500"
          />
          <text
            x={centroidPoint.x + 8}
            y={centroidPoint.y - 8}
            className="fill-red-500 text-xs font-medium"
          >
            CG
          </text>
        </g>
      )}

      {/* Dimension labels */}
      {showDimensions && (
        <g className="fill-slate-600 dark:fill-slate-300 text-xs">
          <text x={widthLabel.x} y={widthLabel.y + 15} textAnchor="middle">
            {sectionWidth.toFixed(1)} cm
          </text>
          <text
            x={heightLabel.x - 5}
            y={heightLabel.y}
            textAnchor="end"
            transform={`rotate(-90, ${heightLabel.x - 5}, ${heightLabel.y})`}
          >
            {sectionHeight.toFixed(1)} cm
          </text>
        </g>
      )}
    </svg>
  );
}

export default SectionVisualizer;
