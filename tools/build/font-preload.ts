// The title screen's two fonts (the pixel display face and the body face) were only found once the game's script
// had run and drawn the title: on a slow connection they arrived a second later and the text jumped when they
// swapped in. The built page now asks for them right away, next to the script.
import type { Plugin } from 'vite';

/** The font files the title screen draws with, by the start of their file names. */
export const TITLE_FONTS = ['jersey-10-latin-400-normal', 'atkinson-hyperlegible-latin-400-normal'];

/** The page with a preload link for each of `files` (built font files, relative to the base) before </head>. */
export function addPreloads(html: string, files: string[], base: string): string {
  const links = files.map((f) => `<link rel="preload" href="${base}${f}" as="font" type="font/woff2" crossorigin>`).join('\n    ');
  return links ? html.replace('</head>', `  ${links}\n  </head>`) : html;
}

export function preloadTitleFonts(): Plugin {
  let base = '/';
  return {
    name: 'whs:preload-title-fonts',
    configResolved(c) {
      base = c.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const files = TITLE_FONTS.map((n) => Object.keys(ctx.bundle!).find((f) => f.endsWith('.woff2') && f.split('/').pop()!.startsWith(n + '-'))).filter((f): f is string => !!f);
        if (files.length !== TITLE_FONTS.length) this.warn?.(`title fonts not found in the build: ${TITLE_FONTS.join(', ')}`);
        return addPreloads(html, files, base);
      },
    },
  };
}
