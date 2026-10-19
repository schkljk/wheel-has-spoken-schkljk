import { ColorMatrixFilter, Container, FillGradient, Graphics, Sprite, Text, Texture, type Application } from 'pixi.js';

/**
 * One frame of everything the wheels and fights draw with (shapes, a gradient, a sprite, text, a color filter), so
 * WebGL's setup and the shader compiles happen while the game is idle instead of on the first wheel (3 s from the
 * tap on a mid-range phone) and the first fight (a 1.4 to 2.3 s freeze). Drawn off screen, then thrown away.
 */
export function warmUp(app: Application) {
  const root = new Container();
  const g = new Graphics().rect(0, 0, 24, 24).fill(0xffcc00).circle(40, 12, 10).fill({ color: 0x3366ff, alpha: 0.5 }).stroke({ width: 2, color: 0x000000 });
  const grad = new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, colorStops: [{ offset: 0, color: 0xffffff }, { offset: 1, color: 0x000000 }] });
  const gg = new Graphics().rect(0, 30, 64, 20).fill(grad);
  const cv = document.createElement('canvas');
  cv.width = cv.height = 4;
  const tex = Texture.from(cv);
  const s = new Sprite(tex);
  s.position.set(4, 4);
  s.filters = [new ColorMatrixFilter()];
  const t = new Text({ text: 'WHS 123', style: { fontFamily: '"WHS Display", "Saira Condensed", system-ui, sans-serif', fontSize: 14, fill: 0xffffff } });
  root.addChild(g, gg, s, t);
  app.stage.addChild(root);
  app.renderer.render(app.stage);
  app.stage.removeChild(root);
  root.destroy({ children: true });
  tex.destroy(true);
  grad.destroy();
}
