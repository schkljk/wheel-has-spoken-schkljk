// Written by tools/build/population.ts (`npm run bake`): computePopulation() in summary.ts, worked out ahead of
// time because it takes a second on a phone. A test fails when the rules change it: run `npm run bake` again.
import type { Population } from './summary';

export const POPULATION: Population = {
  str: [9.35, 4.876559579594337],
  spd: [8.128333333333334, 4.592225011424808],
  dur: [9.19, 4.221441302051548],
  iq: [7.923333333333333, 4.120370803162691],
  wm: [7.296666666666667, 3.6219684641856764],
  pm: [7.8088235294117645, 3.906093855010687],
  cha: [6.983333333333333, 3.707612289451109],
  crit: [16.575, 7.533549960012221],
  dodge: [16.848333333333333, 8.426070489195348],
};
