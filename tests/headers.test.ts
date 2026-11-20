import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
type Rule = { source: string; headers: { key: string; value: string }[] };
const rules: Rule[] = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers;
const header = (source: string, key: string) =>
  rules.find((r) => r.source === source)?.headers.find((h) => h.key === key)?.value;

describe('response headers (vercel.json)', () => {
  const csp = header('/(.*)', 'Content-Security-Policy') ?? '';

  it('sends a security policy that allows only this origin and no inline or eval’d code', () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
  });

  it('sends the other hardening headers with every response', () => {
    expect(header('/(.*)', 'X-Content-Type-Options')).toBe('nosniff');
    expect(header('/(.*)', 'X-Frame-Options')).toBe('DENY');
    expect(header('/(.*)', 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(header('/(.*)', 'Permissions-Policy')).toContain('camera=()');
  });

  it('caches the hashed build files for a year', () => {
    expect(header('/assets/(.*)', 'Cache-Control')).toBe('public, max-age=31536000, immutable');
  });
});

describe('index.html under that policy', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

  it('has no inline scripts, which the policy would block', () => {
    for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) expect(tag, tag).toMatch(/\bsrc=/);
  });

  it('has no inline styles, which the policy would block', () => {
    expect(html).not.toMatch(/<style\b|\sstyle=/);
  });
});
