import { existsSync, readFileSync } from 'node:fs';

export function readPublicContent() {
  const path = 'dist/public-content.json';
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;
}

// This JSON is embedded in HTML, so escape characters that could close a script.
export function serializePublicContent(content) {
  return JSON.stringify(content).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

export async function fetchPublicContent(baseUrl) {
  const url = new URL('/api/public-content', baseUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error('Use an HTTP(S) public API URL without credentials');
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(`Public content snapshot failed: HTTP ${response.status}`);
  const { data, error } = await response.json();
  const resources = ['projects', 'portfolio_project_content', 'portfolio_skill_groups', 'site_settings', 'certifications'];
  if (error || !data || resources.some(key => !Array.isArray(data[key]))) throw Error('Invalid public content snapshot');
  // Copy only the explicitly public resources; never embed arbitrary API fields.
  return Object.fromEntries(resources.map(key => [key, data[key]]));
}
