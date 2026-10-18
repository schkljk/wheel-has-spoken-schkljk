import { facePortrait } from './portraits';

/** A race (and sub-race) as a pixel portrait (its emoji if the sprite can't be drawn). */
export function RaceIcon({ race, rsub, e, class: cls }: { race: string; rsub?: string; e?: string; class?: string }) {
  const url = facePortrait({ race, rsub });
  if (!url) return <span class={cls}>{e}</span>;
  return <img class={`pxi race${cls ? ' ' + cls : ''}`} src={url} alt="" aria-hidden="true" />;
}
