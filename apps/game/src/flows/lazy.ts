// The flows behind the hub's buttons (story, modes, shop, armory, talents) load on first use, in their own chunks,
// with the screens they lead to: the hub only needs to know their names. They were most of the 288 KB the
// game downloaded before it could draw anything; the game fetches them in the background once it is up
// (prefetchFlows), so a tap rarely waits for one.
import type * as Armory from './armory';
import type * as Modes from './modes';
import type * as Shop from './shop';
import type * as Story from './story';
import type * as Talents from './talents';

const modes = () => import('./modes');
const story = () => import('./story');
const shop = () => import('./shop');
const armory = () => import('./armory');
const talents = () => import('./talents');

type Later<F> = F extends (...a: infer A) => infer R ? (...a: A) => Promise<Awaited<R>> : never;
/** `m[k]`, called once its module has loaded. */
function later<M, K extends keyof M>(load: () => Promise<M>, k: K): Later<M[K]> {
  return ((...a: unknown[]) => load().then((m) => (m[k] as (...a: unknown[]) => unknown)(...a))) as Later<M[K]>;
}

export const abandon = later<typeof Modes, 'abandon'>(modes, 'abandon');
export const challengeFlow = later<typeof Modes, 'challengeFlow'>(modes, 'challengeFlow');
export const dailyFlow = later<typeof Modes, 'dailyFlow'>(modes, 'dailyFlow');
export const dailyWheel = later<typeof Modes, 'dailyWheel'>(modes, 'dailyWheel');
export const hardFlow = later<typeof Modes, 'hardFlow'>(modes, 'hardFlow');
export const leaveHard = later<typeof Modes, 'leaveHard'>(modes, 'leaveHard');
export const openClub = later<typeof Modes, 'openClub'>(modes, 'openClub');
export const openDuel = later<typeof Modes, 'openDuel'>(modes, 'openDuel');
export const openTrials = later<typeof Modes, 'openTrials'>(modes, 'openTrials');
export const resumeRun = later<typeof Modes, 'resumeRun'>(modes, 'resumeRun');
export const rushFlow = later<typeof Modes, 'rushFlow'>(modes, 'rushFlow');
export const startTier = later<typeof Modes, 'startTier'>(modes, 'startTier');
export const towerFlow = later<typeof Modes, 'towerFlow'>(modes, 'towerFlow');
export const openBag = later<typeof Story, 'openBag'>(story, 'openBag');
export const openBaseShop = later<typeof Shop, 'openBaseShop'>(shop, 'openBaseShop');
export const openArmory = later<typeof Armory, 'openArmory'>(armory, 'openArmory');
export const swapped = later<typeof Armory, 'swapped'>(armory, 'swapped');
export const openTalents = later<typeof Talents, 'openTalents'>(talents, 'openTalents');

/** Fetches the flows (and the screens they lead to) while the game is idle. */
export function prefetchFlows() {
  for (const load of [modes, story, shop, armory, talents]) void load().catch(() => {});
}
