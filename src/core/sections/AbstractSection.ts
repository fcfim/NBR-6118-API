/**
 * Abstract Section Base Class
 *
 * Base class for all cross-section types (Rectangular, T, I)
 * Provides common interface and utility methods for geometric properties.
 *
 * All dimensions are in cm, areas in cm², moments of inertia in cm⁴
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface SectionProperties {
  /** Cross-sectional area (cm²) */
  area: number;
  /** Moment of inertia about x-axis (cm⁴) */
  Ix: number;
  /** Moment of inertia about y-axis (cm⁴) */
  Iy: number;
  /** Section modulus about x-axis, bottom fiber (cm³) */
  Wx_inf: number;
  /** Section modulus about x-axis, top fiber (cm³) */
  Wx_sup: number;
  /** Section modulus about y-axis (cm³) */
  Wy: number;
  /** Centroid x-coordinate from left edge (cm) */
  xc: number;
  /** Centroid y-coordinate from bottom edge (cm) */
  yc: number;
  /** Total height (cm) */
  h: number;
  /** Total width at widest point (cm) */
  b: number;
  /** Radius of gyration about x-axis (cm) */
  ix: number;
  /** Radius of gyration about y-axis (cm) */
  iy: number;
}

export abstract class AbstractSection {
  /**
   * Get the calculated geometric properties
   */
  abstract get props(): SectionProperties;

  /**
   * Get the polygon points for SVG rendering
   * Points should be ordered counter-clockwise starting from bottom-left
   */
  abstract get points(): Point2D[];

  /**
   * Get the section type identifier
   */
  abstract get type(): string;

  /**
   * Calculate radius of gyration
   */
  protected calculateRadius(I: number, A: number): number {
    return Math.sqrt(I / A);
  }

  /**
   * Convert properties to a plain object for JSON serialization
   */
  toJSON(): { type: string; properties: SectionProperties; points: Point2D[] } {
    return {
      type: this.type,
      properties: this.props,
      points: this.points,
    };
  }
}
