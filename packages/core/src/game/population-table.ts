// Written by tools/build/population.ts (`npm run bake`): computePopulation() in summary.ts, worked out ahead of
// time because it takes a second on a phone. A test fails when the rules change it: run `npm run bake` again.
import type { Population } from './summary';

export const POPULATION: Population = {
  str: [9.35, 4.876559579594337],
  spd: [8.151666666666667, 4.598767648934762],
  dur: [9.19, 4.221441302051548],
  iq: [7.923333333333333, 4.122392778741761],
  wm: [7.295, 3.6402346536086587],
  pm: [7.803921568627451, 3.908360108657664],
  cha: [6.983333333333333, 3.707612289451109],
  crit: [16.58, 7.526858574465175],
  dodge: [16.88, 8.420546300567436],
};
