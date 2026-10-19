import { reducedMotion } from '../state/game';

const DEFAULT = ['#FFB627', '#FF4F8B', '#3DD6C6', '#B388FF', '#FFFFFF'];
let COLORS = DEFAULT;
/** Earned victory confetti (review F11), or the default mix. */
export function setConfetti(colors: string[] | null) {
  COLORS = colors && colors.length ? colors : DEFAULT;
}

/** Confetti anywhere on the page (legacy burstAt). Defaults to the upper middle of the screen. */
export function burst(x = innerWidth / 2, y = innerHeight * 0.4, n = 22) {
  if (reducedMotion()) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    const sz = 4 + Math.random() * 5;
    p.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${COLORS[i % COLORS.length]}`;
    document.body.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const d = 50 + Math.random() * 80;
    const dx = Math.cos(ang) * d;
    const dy = Math.sin(ang) * d - 30;
    const a = p.animate(
      [
        { transform: 'translate(-50%,-50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px),calc(-50% + ${dy + 60}px))`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)' },
    );
    a.finished.then(
      () => p.remove(),
      () => p.remove(),
    );
  }
}
/** Confetti from the middle of an element. */
export function burstFrom(el: Element | null) {
  if (!el) return burst();
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2);
}
