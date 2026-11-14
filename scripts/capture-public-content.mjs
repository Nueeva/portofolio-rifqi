import { writeFileSync, rmSync } from 'node:fs';
import { fetchPublicContent } from './public-content.mjs';
if (process.env.PUBLIC_CONTENT_API_URL) {
  const content = await fetchPublicContent(process.env.PUBLIC_CONTENT_API_URL);
  writeFileSync('dist/public-content.json', JSON.stringify(content));
  console.log('Captured public CMS content for prerender and hydration');
} else {
  rmSync('dist/public-content.json', { force: true });
  console.log('No PUBLIC_CONTENT_API_URL: building curated offline content');
}
