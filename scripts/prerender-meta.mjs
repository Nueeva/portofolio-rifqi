/** Route metadata and bodies share one public CMS snapshot (or curated fallback). */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { prerenderRoutes } from '../dist-server/entry-server.js';
import { readPublicContent } from './public-content.mjs';

const site = 'https://rifqi.apexsions.com';
const baseHtml = readFileSync('dist/index.html', 'utf8');
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
for (const route of prerenderRoutes(readPublicContent())) {
  let html = baseHtml;
  const replace = (pattern, replacement) => {
    if (!pattern.test(html)) throw Error(`Missing metadata marker for ${route.path}`);
    html = html.replace(pattern, () => replacement);
  };
  replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(route.title)}</title>`);
  for (const name of ['description', 'og:description', 'twitter:description']) {
    replace(new RegExp(`<meta (?:name|property)="${name}" content="[^"]*"`), `<meta ${name === 'description' || name.startsWith('twitter:') ? 'name' : 'property'}="${name}" content="${escape(route.description)}"`);
  }
  for (const name of ['og:title', 'twitter:title']) {
    replace(new RegExp(`<meta (?:name|property)="${name}" content="[^"]*"`), `<meta ${name.startsWith('twitter:') ? 'name' : 'property'}="${name}" content="${escape(route.title)}"`);
  }
  const url = site + (route.path ? '/' + route.path : '/');
  replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${escape(url)}"`);
  replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${escape(url)}"`);
  const file = join('dist', route.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`prerender-meta: wrote ${route.path || '/'}`);
}
