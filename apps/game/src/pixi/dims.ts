// Fight layout math, with no Pixi in it: the DOM and the scene both use it (split out in upgrade 44).

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Where everything goes on a screen of W x H (legacy fightDims): the same numbers for the scene and the DOM. */
export interface FightDims {
  W: number;
  H: number;
  /** phones held sideways: fighters on the left, the wheel on the right */
  side: boolean;
  col: number;
  stageW: number;
  groundY: number;
  chH: number;
  /** combat wheel diameter */
  cw: number;
  span: number;
  /** middle between the fighters */
  fcx: number;
  panelX: number;
  panelW: number;
  /** height of the HP bars along the top */
  hud: number;
}
export function fightDims(W: number, H: number): FightDims {
  const side = W > H * 1.15 && H < 600;
  const col = Math.min(W, 760);
  let stageW: number;
  let groundY: number;
  let panelW: number;
  let panelH: number;
  if (side) {
    stageW = Math.round(Math.min(W, 1100) * 0.6);
    groundY = H - 30;
    panelW = W - stageW;
    panelH = H;
  } else {
    stageW = W;
    groundY = Math.round(clamp(H * (H < 700 ? 0.5 : 0.52), 220, Math.min(560, col * 0.95)));
    panelW = col;
    panelH = H - groundY;
  }
  // the HP bars, momentum, energy and the opponent's last moves (measured: 98 to 101 px on every size)
  const hud = 102;
  const span = side ? stageW * 0.26 : col * 0.28;
  const byH = (groundY - hud - 10) / 1.32;
  const byW = ((side ? stageW : col) * 0.42 * 1.2) / 1.32;
  const chH = Math.round(clamp(Math.min(byH, byW), 70, 240));
  const cw = Math.round(clamp(side ? Math.min(panelW * 0.55, panelH - 205) : Math.min(panelW * 0.5, panelH - 150), 90, 260));
  return { W, H, side, col, stageW, groundY, chH, cw, span, fcx: side ? stageW / 2 : W / 2, panelX: side ? stageW : (W - col) / 2, panelW, hud };
}
