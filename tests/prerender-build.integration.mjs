import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';

function build(env) {
  return new Promise((resolve,reject)=>{
    const child=spawn('npm',['run','build'],{env,stdio:['ignore','pipe','pipe']});
    let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
    child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error(output)));
  });
}

test('complete CMS build escapes metadata, hydrates the snapshot, and caches new routes',async()=>{
 const content={projects:[{id:'owner-new',title:'Owner <new> & $& project',problem:'Real problem',solution:'Fresh owner summary',category:'tools',tech_stack:['Node.js'],github_url:null,demo_url:null,image_url:null,created_at:'2026-11-15T00:00:00Z',updated_at:'2026-11-15T00:00:00Z'}],portfolio_project_content:[],portfolio_skill_groups:[],site_settings:[],certifications:[]};
 const server=createServer((req,res)=>{assert.equal(req.url,'/api/public-content');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:content,error:null}));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const env={...process.env,PUBLIC_CONTENT_API_URL:`http://127.0.0.1:${server.address().port}`};
 try{
  await build(env);
  const html=await readFile('dist/projects/owner-new/index.html','utf8');
  assert.ok(html.includes('<title>Owner &lt;new&gt; &amp; $&amp; project — Rifqi Ariansyah</title>'));
  assert.ok(html.includes('Fresh owner summary'));
  assert.ok(html.includes('data-ssr-path="/projects/owner-new"'));
  const embedded=html.match(/<script id="public-content" type="application\/json">(.*?)<\/script>/s)[1];
  assert.deepEqual(JSON.parse(embedded),content);
  assert.ok((await readFile('dist/sw.js','utf8')).includes('projects/owner-new/index.html'));
  await assert.rejects(access('dist/projects/curated-xssscope/index.html'));
 }finally{
  await new Promise(resolve=>server.close(resolve));
  const offlineEnv={...process.env};delete offlineEnv.PUBLIC_CONTENT_API_URL;
  await build(offlineEnv);
 }
});
