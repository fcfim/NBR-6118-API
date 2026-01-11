/**
 * I-Section (Double-T Section)
 *
 * I-shaped cross-section with top flange, web, and bottom flange
 * Can be symmetric or asymmetric (different flange sizes)
 *
 * ```
 *    ┌───────────────┐  ─┬─ hf (top flange height)
 *    │   top flange  │  ─┴─
 *    └──┬───────┬────┘
 *       │ alma  │
 *       │   ●   │        h (total height)
 *       │  (yc) │
 *    ┌──┴───────┴────┐
 *    │ bottom flange │  ─┬─ hi (bottom flange height)
 *    └───────────────┘  ─┴─
 *    ├──────bf──────┤  (top flange width)
 *    ├──────bi──────┤  (bottom flange width)
 *       ├──bw──┤       (web width)
 * ```
 */

import { AbstractSection, Point2D, SectionProperties } from "./AbstractSection";
import { toCm, ValueWithUnit } from "../utils/units";

export interface ISectionParams {
  /** Top flange width (largura mesa superior) */
  bf: number | ValueWithUnit;
  /** Top flange height (altura mesa superior) */
  hf: number | ValueWithUnit;
  /** Web width (largura da alma) */
  bw: number | ValueWithUnit;
  /** Total height (altura total) */
  h: number | ValueWithUnit;
  /** Bottom flange width (largura mesa inferior) */
  bi: number | ValueWithUnit;
  /** Bottom flange height (altura mesa inferior) */
  hi: number | ValueWithUnit;
}

export class ISection extends AbstractSection {
  private readonly bf: number;
  private readonly hf: number;
  private readonly bw: number;
  private readonly h: number;
  private readonly bi: number;
  private readonly hi: number;
  private readonly hw: number; // web height
  private readonly _props: SectionProperties;
  private readonly _points: Point2D[];

  constructor(params: ISectionParams) {
    super();

    // Convert to cm
    this.bf = toCm(params.bf);
    this.hf = toCm(params.hf);
    this.bw = toCm(params.bw);
    this.h = toCm(params.h);
    this.bi = toCm(params.bi);
    this.hi = toCm(params.hi);
    this.hw = this.h - this.hf - this.hi;

    // Validate
    if (
      this.bf <= 0 ||
      this.hf <= 0 ||
      this.bw <= 0 ||
      this.h <= 0 ||
      this.bi <= 0 ||
      this.hi <= 0
    ) {
      throw new Error("Section dimensions must be positive");
    }
    if (this.bw > this.bf || this.bw > this.bi) {
      throw new Error("Web width (bw) cannot be greater than flange widths");
    }
    if (this.hf + this.hi >= this.h) {
      throw new Error("Sum of flange heights must be less than total height");
    }

    this._props = this.calculateProperties();
    this._points = this.calculatePoints();
  }

  get type(): string {
    return "I";
  }

  get props(): SectionProperties {
    return this._props;
  }

  get points(): Point2D[] {
    return this._points;
  }

  private calculateProperties(): SectionProperties {
    const { bf, hf, bw, h, bi, hi, hw } = this;

    // Areas of component rectangles
    const Atf = bf * hf; // top flange
    const Aw = bw * hw; // web
    const Abf = bi * hi; // bottom flange
    const area = Atf + Aw + Abf;

    // Centroids of components (from bottom)
    const ytf = h - hf / 2; // top flange centroid
    const yw = hi + hw / 2; // web centroid
    const ybf = hi / 2; // bottom flange centroid

    // Composite centroid (from bottom)
    const yc = (Atf * ytf + Aw * yw + Abf * ybf) / area;
    const maxWidth = Math.max(bf, bi);
    const xc = maxWidth / 2;

    // Moments of inertia about component centroids
    const Ixtf = (bf * Math.pow(hf, 3)) / 12;
    const Ixw = (bw * Math.pow(hw, 3)) / 12;
    const Ixbf = (bi * Math.pow(hi, 3)) / 12;

    // Parallel axis theorem
    const dtf = ytf - yc;
    const dw = yw - yc;
    const dbf = ybf - yc;
    const Ix =
      Ixtf +
      Atf * Math.pow(dtf, 2) +
      Ixw +
      Aw * Math.pow(dw, 2) +
      Ixbf +
      Abf * Math.pow(dbf, 2);

    // Iy about vertical centroidal axis
    const Iytf = (hf * Math.pow(bf, 3)) / 12;
    const Iyw = (hw * Math.pow(bw, 3)) / 12;
    const Iybf = (hi * Math.pow(bi, 3)) / 12;
    const Iy = Iytf + Iyw + Iybf;

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
      b: maxWidth,
      ix,
      iy,
    };
  }

  private calculatePoints(): Point2D[] {
    const { bf, hf, bw, h, bi, hi, hw } = this;
    const maxWidth = Math.max(bf, bi);

    // Offsets to center flanges and web
    const topFlangeOffset = (maxWidth - bf) / 2;
    const webOffset = (maxWidth - bw) / 2;
    const bottomFlangeOffset = (maxWidth - bi) / 2;

    // Counter-clockwise from bottom-left
    return [
      // Bottom flange
      { x: bottomFlangeOffset, y: 0 },
      { x: bottomFlangeOffset + bi, y: 0 },
      { x: bottomFlangeOffset + bi, y: hi },
      // Right side of web junction
      { x: webOffset + bw, y: hi },
      { x: webOffset + bw, y: hi + hw },
      // Top flange right
      { x: topFlangeOffset + bf, y: hi + hw },
      { x: topFlangeOffset + bf, y: h },
      { x: topFlangeOffset, y: h },
      // Top flange left
      { x: topFlangeOffset, y: hi + hw },
      // Left side of web junction
      { x: webOffset, y: hi + hw },
      { x: webOffset, y: hi },
      // Bottom flange left
      { x: bottomFlangeOffset, y: hi },
    ];
  }
}

export default ISection;
