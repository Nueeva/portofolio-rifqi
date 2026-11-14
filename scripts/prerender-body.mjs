import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, prerenderRoutes } from '../dist-server/entry-server.js';
import { readPublicContent, serializePublicContent } from './public-content.mjs';

const content = readPublicContent();
for (const route of prerenderRoutes(content)) {
  const path = '/' + route.path;
  const file = join('dist', route.path, 'index.html');
  const shell = readFileSync(file, 'utf8');
  const marker = '<div id="root"></div>';
  if (!shell.includes(marker)) throw Error(`Missing empty root in ${file}`);
  const body = await render(path, content);
  if (!body || body.length < 200) throw Error(`Empty prerender for ${path}`);
  const snapshot = content ? `<script id="public-content" type="application/json">${serializePublicContent(content)}</script>` : '';
  writeFileSync(file, shell.replace(marker, () => `${snapshot}<div id="root" data-ssr-path="${path}">${body}</div>`));
  console.log(`prerender-body: wrote ${path}`);
}
