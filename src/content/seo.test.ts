import { describe, expect, it } from 'vitest';
import { profile } from './profile';
import { personJsonLd, personJsonLdScript, robotsTxt, siteRoot, sitemapXml } from './seo';

const SITE = 'https://example.vercel.app';

describe('seo', () => {
  it('drops trailing slashes from the site address', () => {
    expect(siteRoot('https://example.vercel.app//')).toBe(SITE);
    expect(siteRoot(` ${SITE} `)).toBe(SITE);
  });

  it('describes the owner as a Person linked to their profiles', () => {
    const person = personJsonLd(`${SITE}/`);
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe(profile.name);
    expect(person.url).toBe(`${SITE}/`);
    expect(person.sameAs).toEqual([profile.github.href, profile.linkedin.href]);
    expect(person.award).toMatch(/^Best Paper Award, IEEE IMC 2026/);
  });

  it('writes the JSON-LD as a data block nothing can break out of', () => {
    const script = personJsonLdScript(SITE);
    expect(script).toMatch(/^<script type="application\/ld\+json">\{.*\}<\/script>$/);
    expect(script.slice('<script'.length, -'</script>'.length)).not.toContain('<');
    const json = script.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    expect(JSON.parse(json)).toEqual(personJsonLd(SITE));
  });

  it('points robots.txt at the sitemap, and the sitemap at the page', () => {
    expect(robotsTxt(SITE)).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robotsTxt(SITE)).toContain('Allow: /');
    expect(sitemapXml(SITE)).toContain(`<loc>${SITE}/</loc>`);
  });
});
