// Run on the nginx host, with RELEASE_ROOT and the existing bootstrap credentials.
// Uses explicit virtual-host HTTP routing; never prints credentials or page content.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = process.env.RELEASE_ROOT;
assert.ok(root?.startsWith('/var/www/rifqi-releases/'), 'Set RELEASE_ROOT to the staged release');
const origin = 'https://rifqi.apexsions.com';
const headers = { Host: 'rifqi.apexsions.com', Origin: origin, Connection: 'close', 'User-Agent': 'Celah release verification' };
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: 80, path, method: options.method ?? 'GET', headers: { ...headers, ...options.headers } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        const bytes = Buffer.concat(chunks);
        resolve({ status: response.statusCode, bytes,
          header: name => { const value = response.headers[name.toLowerCase()]; return Array.isArray(value) ? value.join(', ') : value; },
          json: () => JSON.parse(bytes.toString()),
        });
      });
    });
    req.setTimeout(10000, () => req.destroy(new Error('Verification request timed out')));
    req.on('error', reject);
    if (options.body !== undefined) req.write(options.body);
    req.end();
  });
}
const hash = value => createHash('sha256').update(value).digest('hex');
async function checkFile(path, file) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.equal(hash(response.bytes), hash(await readFile(`${root}/${file}`)), `${path} integrity`);
  return response;
}

// nginx reload is asynchronous; wait briefly for the new workers to accept traffic.
const expected = hash(await readFile(`${root}/index.html`));
for (let attempt = 0; attempt < 20; attempt++) {
  if (hash((await request('/')).bytes) === expected) break;
  if (attempt === 19) throw Error('New release did not become active');
  await new Promise(resolve => setTimeout(resolve, 100));
}
for (const [path, file] of [['/', 'index.html'], ['/about', 'about/index.html'], ['/projects', 'projects/index.html'], ['/contact', 'contact/index.html'],
  ...['xssscope', 'apexsions', 'portfolio71', 'ctf-toolkit'].map(id => [`/projects/curated-${id}`, `projects/curated-${id}/index.html`])]) await checkFile(path, file);
const index = await readFile(`${root}/index.html`, 'utf8');
const assets = [...index.matchAll(/(?:src|href)="\/(assets\/[^" ]+)"/g)].map(match => match[1]);
for (const file of new Set(assets)) await checkFile(`/${file}`, file);
for (const file of ['cv-rifqi-ariansyah.pdf', 'favicon.ico', 'og-image.png', 'manifest.webmanifest', 'registerSW.js', 'sw.js']) await checkFile(`/${file}`, file);
assert.match((await request('/sw.js')).header('cache-control'), /no-cache/);
assert.match((await request('/')).header('cache-control'), /no-cache/);
const health = await request('/api/health');
assert.equal(health.status, 200);
assert.deepEqual(health.json(), { ok: true, emailConfigured: false, captchaConfigured: false });
const post = (path, body, cookie) => request(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
const projects = await post('/api/data/projects', { operation: 'select' });
assert.equal(projects.status, 200);
const catalog = projects.json().data;
assert.ok(catalog.some(project => project.id === 'curated-xssscope'));
assert.equal((await post('/api/data/ip_logs', { operation: 'select' })).status, 403);
assert.ok(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD, 'Load the private bootstrap credentials');
const login = await post('/api/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
assert.equal(login.status, 200);
const setCookie = login.header('set-cookie');
assert.match(setCookie, /HttpOnly/i);
assert.match(setCookie, /Secure/i);
assert.match(setCookie, /SameSite=Lax/i);
const cookie = setCookie.split(';')[0];
try {
  assert.equal((await request('/api/auth/session', { headers: { Cookie: cookie } })).json().data.session.user.email, process.env.ADMIN_EMAIL);
  assert.equal((await post('/api/data/ip_logs', { operation: 'select', limit: 1 }, cookie)).status, 200);
} finally { assert.equal((await post('/api/auth/logout', {}, cookie)).status, 200); }
assert.equal((await post('/api/data/ip_logs', { operation: 'select' }, cookie)).status, 403);
const media = catalog.find(project => project.image_url?.startsWith('/api/storage/'));
if (media) {
  const image = await request(media.image_url);
  assert.equal(image.status, 200);
  assert.match(image.header('content-type'), /^image\//);
}
assert.equal((await request('/assets/release-missing-chunk.js')).status, 404);
console.log(JSON.stringify({ pages: 8, criticalAssets: 'hash-matched', serviceWorker: 'current/no-cache', backend: 'PostgreSQL', adminSession: 'passed', privateReads: 'protected', email: 'unconfigured', captcha: 'unconfigured' }));
