// What search engines read besides the page: the Person structured data, robots.txt and the sitemap.
// Built from the content at build time (see the `seo` plugin in vite.config.ts), with the live
// address from VITE_SITE_URL. Nothing here is imported by the app.
import { bestPaper } from './award';
import { profile } from './profile';

const SCHOOL = 'Sirindhorn International Institute of Technology, Thammasat University';

/** The live address without a trailing slash. */
export const siteRoot = (siteUrl: string) => siteUrl.trim().replace(/\/+$/, '');

/** schema.org Person, for search engines to tie the name to the profiles, the school and the award. */
export function personJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: `${siteRoot(siteUrl)}/`,
    description: profile.intro,
    affiliation: { '@type': 'CollegeOrUniversity', name: SCHOOL },
    award: `Best Paper Award, ${bestPaper.venue}`,
    sameAs: [profile.github.href, profile.linkedin.href],
  };
}

/** The JSON-LD as a <script> data block. `<` is escaped so no string can close the tag. */
export function personJsonLdScript(siteUrl: string) {
  const json = JSON.stringify(personJsonLd(siteUrl)).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function robotsTxt(siteUrl: string) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteRoot(siteUrl)}/sitemap.xml\n`;
}

export function sitemapXml(siteUrl: string) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${siteRoot(siteUrl)}/</loc></url>`,
    '</urlset>',
    '',
  ].join('\n');
}
