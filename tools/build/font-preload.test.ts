import { describe, expect, it } from 'vitest';
import { addPreloads } from './font-preload';

describe('title font preloads', () => {
  it('go in the head, under the base path, as CORS font fetches', () => {
    const html = '<html><head><title>x</title></head><body></body></html>';
    const out = addPreloads(html, ['assets/jersey-10-latin-400-normal-abc.woff2'], '/repo/');
    expect(out).toContain('<link rel="preload" href="/repo/assets/jersey-10-latin-400-normal-abc.woff2" as="font" type="font/woff2" crossorigin>');
    expect(out.indexOf('preload')).toBeLessThan(out.indexOf('</head>'));
    expect(addPreloads(html, [], '/')).toBe(html);
  });
});
