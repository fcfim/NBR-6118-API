/**
 * T-Section (Tee Section)
 *
 * T-shaped cross-section with flange (mesa) and web (alma)
 *
 * ```
 *    ┌───────────────┐  ─┬─ hf (flange height)
 *    │      mesa     │  ─┴─
 *    └──┬───────┬────┘
 *       │ alma  │
 *       │   ●   │        h (total height)
 *       │  (yc) │
 *       └───────┘       ─┴─
 *    ├──────bf──────┤
 *       ├──bw──┤
 * ```
 *
 * Parameters:
 * - bf: flange width (largura da mesa)
 * - hf: flange height (altura da mesa)
 * - bw: web width (largura da alma)
 * - h: total height (altura total)
 */

import { AbstractSection, Point2D, SectionProperties } from "./AbstractSection";
import { toCm, ValueWithUnit } from "../utils/units";

export interface TSectionParams {
  /** Flange width (largura da mesa) */
  bf: number | ValueWithUnit;
  /** Flange height (altura da mesa) */
  hf: number | ValueWithUnit;
  /** Web width (largura da alma) */
  bw: number | ValueWithUnit;
  /** Total height (altura total) */
  h: number | ValueWithUnit;
}

export class TSection extends AbstractSection {
  private readonly bf: number;
  private readonly hf: number;
  private readonly bw: number;
  private readonly h: number;
  private readonly hw: number; // web height
  private readonly _props: SectionProperties;
  private readonly _points: Point2D[];

  constructor(params: TSectionParams) {
    super();

    // Convert to cm
    this.bf = toCm(params.bf);
    this.hf = toCm(params.hf);
    this.bw = toCm(params.bw);
    this.h = toCm(params.h);
    this.hw = this.h - this.hf;

    // Validate
    if (this.bf <= 0 || this.hf <= 0 || this.bw <= 0 || this.h <= 0) {
      throw new Error("Section dimensions must be positive");
    }
    if (this.bw > this.bf) {
      throw new Error(
        "Web width (bw) cannot be greater than flange width (bf)"
      );
    }
    if (this.hf >= this.h) {
      throw new Error("Flange height (hf) must be less than total height (h)");
    }

    this._props = this.calculateProperties();
    this._points = this.calculatePoints();
  }

  get type(): string {
    return "T";
  }

  get props(): SectionProperties {
    return this._props;
  }

  get points(): Point2D[] {
    return this._points;
  }

  private calculateProperties(): SectionProperties {
    const { bf, hf, bw, h, hw } = this;

    // Areas of component rectangles
    const Af = bf * hf; // flange area
    const Aw = bw * hw; // web area
    const area = Af + Aw;

    // Centroids of components (from bottom)
    const yf = h - hf / 2; // flange centroid
    const yw = hw / 2; // web centroid

    // Composite centroid (from bottom)
    const yc = (Af * yf + Aw * yw) / area;
    const xc = bf / 2; // symmetric about vertical axis

    // Moments of inertia about component centroids
    const Ixf = (bf * Math.pow(hf, 3)) / 12;
    const Ixw = (bw * Math.pow(hw, 3)) / 12;

    // Parallel axis theorem: I = I_local + A * d²
    const df = yf - yc;
    const dw = yw - yc;
    const Ix = Ixf + Af * Math.pow(df, 2) + Ixw + Aw * Math.pow(dw, 2);

    // Iy about vertical centroidal axis (both symmetric)
    const Iyf = (hf * Math.pow(bf, 3)) / 12;
    const Iyw = (hw * Math.pow(bw, 3)) / 12;
    const Iy = Iyf + Iyw;

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
      b: bf,
      ix,
      iy,
    };
  }

  private calculatePoints(): Point2D[] {
    const { bf, hf, bw, h, hw } = this;
    const webOffset = (bf - bw) / 2;

    // Counter-clockwise from bottom-left of web
    return [
      { x: webOffset, y: 0 }, // bottom-left of web
      { x: webOffset + bw, y: 0 }, // bottom-right of web
      { x: webOffset + bw, y: hw }, // top-right of web
      { x: bf, y: hw }, // bottom-right of flange
      { x: bf, y: h }, // top-right of flange
      { x: 0, y: h }, // top-left of flange
      { x: 0, y: hw }, // bottom-left of flange
      { x: webOffset, y: hw }, // top-left of web
    ];
  }
}

export default TSection;
