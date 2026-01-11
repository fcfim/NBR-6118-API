/**
 * Rectangular Section
 *
 * Simple rectangular cross-section (b × h)
 *
 * ```
 *    ┌─────────┐  ─┬─
 *    │         │   │
 *    │    ●    │   │ h (height)
 *    │   (yc)  │   │
 *    └─────────┘  ─┴─
 *    ├────b────┤
 *       (width)
 * ```
 */

import { AbstractSection, Point2D, SectionProperties } from "./AbstractSection";
import { toCm, ValueWithUnit } from "../utils/units";

export interface RectangularParams {
  /** Width/base of the section */
  base: number | ValueWithUnit;
  /** Height of the section */
  height: number | ValueWithUnit;
}

export class Rectangular extends AbstractSection {
  private readonly b: number; // width in cm
  private readonly h: number; // height in cm
  private readonly _props: SectionProperties;
  private readonly _points: Point2D[];

  constructor(params: RectangularParams) {
    super();

    // Convert to cm
    this.b = toCm(params.base);
    this.h = toCm(params.height);

    // Validate
    if (this.b <= 0 || this.h <= 0) {
      throw new Error("Section dimensions must be positive");
    }

    // Calculate properties
    this._props = this.calculateProperties();
    this._points = this.calculatePoints();
  }

  get type(): string {
    return "rectangular";
  }

  get props(): SectionProperties {
    return this._props;
  }

  get points(): Point2D[] {
    return this._points;
  }

  private calculateProperties(): SectionProperties {
    const b = this.b;
    const h = this.h;

    // Area
    const area = b * h;

    // Centroid (from bottom-left corner)
    const xc = b / 2;
    const yc = h / 2;

    // Moments of inertia about centroidal axes
    const Ix = (b * Math.pow(h, 3)) / 12;
    const Iy = (h * Math.pow(b, 3)) / 12;

    // Section moduli
    const Wx_inf = Ix / yc;
    const Wx_sup = Ix / (h - yc);
    const Wy = Iy / xc;

    // Radii of gyration
    const ix = this.calculateRadius(Ix, area);
    const iy = this.calculateRadius(Iy, area);

    return {
      area,
      Ix,
      Iy,
      Wx_inf,
      Wx_sup,
      Wy,
      xc,
      yc,
      h,
      b,
      ix,
      iy,
    };
  }

  private calculatePoints(): Point2D[] {
    // Counter-clockwise from bottom-left
    return [
      { x: 0, y: 0 },
      { x: this.b, y: 0 },
      { x: this.b, y: this.h },
      { x: 0, y: this.h },
    ];
  }
}

export default Rectangular;
