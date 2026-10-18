import { fighterFace } from './portraits';
import { lookOf, type LookSource } from './sprite';

/** A fighter's face as a pixel portrait (their race emoji if the sprite can't be drawn). */
export function FighterFace({ f, e }: { f: LookSource; e?: string }) {
  const url = fighterFace(lookOf(f));
  if (!url) return <span aria-hidden="true">{e}</span>;
  return <img class="pxi face" src={url} alt="" aria-hidden="true" />;
}
