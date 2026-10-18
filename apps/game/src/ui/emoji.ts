// No emoji reaches the screen: every one in text the game renders is swapped for its pixel icon (art/emoji-px.ts)
// before Preact draws it. The icon keeps the emoji as its alt text, so screen readers and copy-paste still get it.

import { h, options, type VNode } from 'preact';
import { emojiUrl } from '../art/emoji-px';

// an emoji: one that shows as a picture by default, or any pictograph asked to (U+FE0F), with skin tones and
// zero-width-joined sequences (👨‍🍳, 🏴‍☠️). Plain symbols like ★ → ✓ stay text.
const EMO = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)\p{Emoji_Modifier}?(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})\uFE0F?\p{Emoji_Modifier}?)*\uFE0F?/gu;
// a cheap first look: surrogate pairs and the symbol blocks
const MAYBE = /[\u2190-\u2BFF\ud83c-\ud83e]/;
// elements that only hold plain text
const SKIP = new Set(['textarea', 'option', 'title', 'style', 'script', 'text', 'tspan', 'input']);

/** The emojis in a string, in order (what iconize swaps). */
export function findEmojis(s: string): string[] {
  if (!MAYBE.test(s)) return [];
  return [...s.matchAll(EMO)].map((m) => m[0]);
}

/** A string with its emojis swapped for icons: the same string when it has none. */
export function iconize(s: string): string | (string | VNode<any>)[] {
  if (!MAYBE.test(s)) return s;
  EMO.lastIndex = 0;
  if (!EMO.test(s)) return s;
  EMO.lastIndex = 0;
  const out: (string | VNode<any>)[] = [];
  let last = 0;
  for (const m of s.matchAll(EMO)) {
    const url = emojiUrl(m[0]);
    if (!url) continue;
    if (m.index! > last) out.push(s.slice(last, m.index));
    out.push(h('img', { class: 'pxe', src: url, alt: m[0], draggable: false }));
    last = m.index! + m[0].length;
  }
  if (!out.length) return s;
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function swap(ch: unknown): unknown {
  if (typeof ch === 'string') return iconize(ch);
  if (Array.isArray(ch)) {
    let changed = false;
    const out = ch.map((c) => {
      const n = swap(c);
      if (n !== c) changed = true;
      return n;
    });
    return changed ? out : ch;
  }
  return ch;
}

/** Turns every emoji in the game's text into a pixel icon from now on. */
export function installEmojiIcons() {
  const prev = options.vnode;
  options.vnode = (v) => {
    if (typeof v.type === 'string' && !SKIP.has(v.type)) {
      const p = v.props as { children?: unknown };
      if (p.children != null) p.children = swap(p.children);
    }
    if (prev) prev(v);
  };
}
