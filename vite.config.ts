import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { personJsonLdScript, robotsTxt, sitemapXml } from './src/content/seo';

/** The headers vercel.json sends with every response, so `npm run preview` serves the same security policy. */
function vercelHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
  const all = config.headers.find((h: { source: string }) => h.source === '/(.*)');
  return Object.fromEntries(all.headers.map((h: { key: string; value: string }) => [h.key, h.value]));
}

/** At build time: the Person JSON-LD in <head>, plus robots.txt and sitemap.xml, from the content and VITE_SITE_URL. */
function seo(siteUrl: string | undefined): Plugin {
  return {
    name: 'seo',
    apply: 'build',
    buildStart() {
      if (!siteUrl) this.error('VITE_SITE_URL is not set: robots.txt, the sitemap and the structured data need the live address');
    },
    transformIndexHtml: (html) => html.replace('</head>', `    ${personJsonLdScript(siteUrl!)}\n  </head>`),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl!) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteUrl!) });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), seo(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL)],
  build: { target: 'es2022' },
  // not the dev server: the security policy would block Vite's inline HMR scripts
  preview: { headers: vercelHeaders() },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
    // Node 22.4+ has its own localStorage global, which clashes with jsdom's and prints a warning; turn it off where it exists
    execArgv: process.allowedNodeEnvironmentFlags.has('--experimental-webstorage') ? ['--no-experimental-webstorage'] : [],
  },
}));
