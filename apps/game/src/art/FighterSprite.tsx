import { OL, PAURA, SIZE_H, SPRITE_PH, type Look } from './sprite';
import { spriteImages } from './sprite-dom';

// crisp pixels when each one gets at least 1.5 screen pixels, smooth below that (small fighters)
const render = (hh: number) => ((hh * (globalThis.devicePixelRatio || 1)) / SPRITE_PH >= 1.5 ? 'image-rendering:pixelated' : 'image-rendering:auto');

/** One limb of the old vector art: an outline stroke under a colored stroke (legacy art_build.js limb). */
function Limb({ x1, y1, x2, y2, w, c }: { x1: number; y1: number; x2: number; y2: number; w: number; c: string }) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={OL} stroke-width={w + 2.2} stroke-linecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} stroke-width={w} stroke-linecap="round" />
    </>
  );
}

/**
 * The "who is this?" figure. Legacy drew any look without a race with its older vector renderer (charSVGVec in
 * art_build.js), which only happens while a fighter is being built, before the race wheel lands. That
 * renderer is not ported; this is its no-race branch (a faded figure with a "?"), also used if a sprite
 * ever fails to build.
 */
function Mystery() {
  const c = '#B9A9C9';
  return (
    <>
      <g opacity=".55">
        <Limb x1={45} y1={86} x2={43} y2={112} w={9} c={c} />
        <Limb x1={55} y1={86} x2={57} y2={112} w={9} c={c} />
        <rect x="36" y="51" width="28" height="37" rx="8" fill={c} />
        <circle cx="50" cy="34" r="14" fill={c} />
      </g>
      <text x="50" y="40" text-anchor="middle" font-size="17" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">
        ?
      </text>
    </>
  );
}

export interface SpriteProps {
  look: Look;
  /** height in px before the size scale (default 110) */
  h?: number;
  /** scale by the fighter's size wheel (Tiny 0.72 ... Colossal 1.32) */
  sized?: boolean;
  /** face left */
  mirror?: boolean;
  class?: string;
}

/**
 * A fighter's pixel sprite, same markup as legacy charSVG: shadow, chosen-one halo, power aura, body layer, and
 * the weapon arm in `g.armw` (data-sx/data-sy = shoulder pivot in viewBox units, for swing animations).
 */
export function FighterSprite({ look, h = 110, sized, mirror, class: cls }: SpriteProps) {
  const sc = sized ? (look.size !== undefined && SIZE_H[look.size]) || 1 : 1;
  const hh = Math.round(h * sc),
    ww = Math.round((hh * 100) / 120);
  const img = spriteImages(look);
  const PX = render(hh);
  const aura = img && look.power && look.power !== 'none' ? PAURA[look.power] : undefined;
  const inner = img ? (
    <>
      <ellipse cx="50" cy="116.5" rx="24" ry="4.2" fill="#000" opacity=".28" />
      {look.arch === 'chosen' && <circle cx="50" cy="60" r="44" fill="#FFE082" opacity=".18" />}
      {aura && <ellipse cx="50" cy="115" rx="31" ry="5.5" fill={aura} opacity=".5" />}
      <image href={img.body} x="0" y="0" width="100" height="120" preserveAspectRatio="none" style={PX} />
      <g class="armw" data-sx={img.sx.toFixed(1)} data-sy={img.sy.toFixed(1)}>
        <image href={img.arm} x="0" y="0" width="100" height="120" preserveAspectRatio="none" style={PX} />
      </g>
    </>
  ) : (
    <Mystery />
  );
  const cl = (img ? 'ch px' : 'ch') + (cls ? ' ' + cls : '');
  return (
    <svg class={cl} viewBox="0 0 100 120" width={ww} height={hh} aria-hidden="true">
      {mirror ? <g transform="translate(100 0) scale(-1 1)">{inner}</g> : inner}
    </svg>
  );
}
