import { N_ADJ, N_DESTROY, N_EPI, N_FIRST, N_NICK, N_NOUN, N_PLACE, N_ROLE, N_ROMAN, N_SURN, N_TAG, N_TITLE } from './data/names';
import { pick, pickW } from './random';
import type { Rng } from './rng';

type Template = [weight: number, make: (r: Rng) => string];

/** Name shapes and how often each comes up. */
const NAME_T: Template[] = [
  [8, (r) => `${pick(r, N_TITLE)} ${pick(r, N_FIRST)}`],
  [5, (r) => `${pick(r, N_TITLE)} ${pick(r, N_FIRST)} ${pick(r, N_EPI)}`],
  [5, (r) => `${pick(r, N_FIRST)} ${pick(r, N_EPI)}`],
  [4, (r) => `${pick(r, N_ADJ)} ${pick(r, N_FIRST)}`],
  [4, (r) => `${pick(r, N_ADJ)} ${pick(r, N_NOUN)}`],
  [2, (r) => `The ${pick(r, N_ADJ)} ${pick(r, N_NOUN)}`],
  [1.5, (r) => `xX_${pick(r, N_NOUN)}_Xx`],
  [3, (r) => `${pick(r, N_FIRST)} the ${pick(r, N_NOUN)}`],
  [2, (r) => `${pick(r, N_FIRST)}${pick(r, N_TAG)}`],
  [1.5, (r) => `Not ${pick(r, N_FIRST)}`],
  [3, (r) => `${pick(r, N_FIRST)} from ${pick(r, N_PLACE)}`],
  [5, (r) => `${pick(r, N_FIRST)} ${pick(r, N_SURN)}`],
  [1.5, (r) => `Big ${pick(r, N_NOUN)} Energy`],
  [1.5, (r) => `${pick(r, N_FIRST)}, Eater of ${pick(r, N_DESTROY)}`],
  [1, (r) => `Destroyer of ${pick(r, N_DESTROY)}`],
  [2.5, (r) => `Lil ${pick(r, N_NOUN)}`],
  [2, (r) => `${pick(r, N_ADJ)} ${pick(r, N_TITLE)} ${pick(r, N_FIRST)}`],
  [2, (r) => `${pick(r, N_NOUN)} ${pick(r, N_SURN)}`],
  [1, (r) => `${pick(r, N_FIRST)} (${pick(r, N_ADJ)})`],
  [1, (r) => `Two ${pick(r, N_NOUN)}s in a Coat`],
  [4, (r) => `${pick(r, N_FIRST)} "${pick(r, N_NICK)}" ${pick(r, N_SURN)}`],
  [2, (r) => `${pick(r, N_FIRST)} "${pick(r, N_NICK)}"`],
  [2, (r) => `${pick(r, N_FIRST)} ${pick(r, N_ROMAN)}`],
  [2, (r) => `${pick(r, N_TITLE)} ${pick(r, N_FIRST)} ${pick(r, N_ROMAN)}`],
  [1.5, (r) => `${pick(r, N_FIRST)} ${pick(r, N_SURN)} ${pick(r, N_ROMAN)}`],
  [3, (r) => `${pick(r, N_NOUN)} ${pick(r, N_ROLE)}`],
  [1.5, (r) => `The ${pick(r, N_NOUN)} ${pick(r, N_ROLE)}`],
  [
    1.5,
    (r) => {
      const a = pick(r, N_FIRST);
      let b = pick(r, N_FIRST);
      while (b === a) b = pick(r, N_FIRST);
      return `${a}-${b}`;
    },
  ],
  [1.5, (r) => `Dr. ${pick(r, N_NOUN)}`],
  [2, (r) => `${pick(r, N_TITLE)} of ${pick(r, N_PLACE)}`],
  [1, (r) => pick(r, N_NICK)],
  [1.5, (r) => `${pick(r, N_ADJ)} ${pick(r, N_NOUN)} ${pick(r, N_SURN)}`],
  [1.5, (r) => `${pick(r, N_FIRST)}, ${pick(r, N_NOUN)} ${pick(r, N_ROLE)}`],
  [1, (r) => `Sir ${pick(r, N_NOUN)}-a-lot`],
  [1, (r) => `${pick(r, N_ADJ)} ${pick(r, N_FIRST)} ${pick(r, N_ROMAN)}`],
];
const NAME_W = NAME_T.map((x) => ({ w: x[0] }));

/** A meme name, always 24 characters or fewer. */
export function randName(rng: Rng): string {
  for (let i = 0; i < 40; i++) {
    const t = NAME_T[pickW(rng, NAME_W)]![1](rng);
    if (t.length <= 24) return t;
  }
  return `${pick(rng, N_TITLE)} ${pick(rng, N_FIRST)}`;
}
