import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sw = read("dist/sw.js");
const pages = ["index.html","about/index.html","projects/index.html","contact/index.html",...['apexsions','portfolio71','xssscope','ctf-toolkit'].map(id=>`projects/curated-${id}/index.html`)];
for(const page of pages)test(`PWA revisions match final prerender: ${page}`,()=>{
 const source=read("dist/"+page);const digest=createHash("md5").update(source).digest("hex");
 assert.ok(sw.includes(`url:"${page}",revision:"${digest}"`),`final HTML revision missing: ${page}`);
 assert.match(source,/data-ssr-path=/);
 // CMS snapshots preserve the owner's raw settings, including historical labels.
 // Check published markup/metadata without treating inert source data as visible copy.
 const markup=source.replace(/<script id="public-content" type="application\/json">[\s\S]*?<\/script>/g, "");
 assert.doesNotMatch(markup,/Cybersecurity Developer|cybersecurity developer/);
});
test("optional engines, assistant and legacy pages stay outside initial cache",()=>{
 for(const file of readdirSync(new URL("../dist/assets/",import.meta.url)))if(/^(three|OpticalField|PublicRiva|LegacyLayout|Admin|Auth|CustomCursor)-/.test(file))assert.ok(!sw.includes(`url:"assets/${file}"`),file);
});
test("initial JavaScript stays below 200 kB gzip and excludes Three.js",()=>{
 const seen=new Set();function collect(file){if(seen.has(file))return;seen.add(file);for(const m of read("dist/"+file).matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g))collect("assets/"+m[1]);}
 for(const m of read("dist/index.html").matchAll(/(?:src|href)="\/(assets\/[^" ]+\.js)"/g))collect(m[1]);
 const size=[...seen].reduce((sum,file)=>sum+gzipSync(read("dist/"+file)).length,0);
 assert.ok(size<=200_000,`${size} gzip bytes`);assert.ok(![...seen].some(f=>f.includes("three-")));
});
test("restored public assets remain present",()=>{
 for(const file of ["cv-rifqi-ariansyah.pdf","favicon.ico","og-image.png","fonts/instrument-serif-italic.ttf"])assert.ok(existsSync(new URL("../dist/"+file,import.meta.url)),file);
});

test("Home plus optical and interaction features fits the 450 kB gzip budget",()=>{
 const seen=new Set();function collect(file){if(seen.has(file))return;seen.add(file);for(const m of read("dist/"+file).matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g))collect("assets/"+m[1]);}
 for(const m of read("dist/index.html").matchAll(/(?:src|href)="\/(assets\/[^" ]+\.js)"/g))collect(m[1]);
 for(const file of readdirSync(new URL("../dist/assets/",import.meta.url)))if(/^(three|OpticalField|motionFeatures|lenis|client|CustomCursor)-/.test(file))collect("assets/"+file);
 const size=[...seen].reduce((sum,file)=>sum+gzipSync(read("dist/"+file)).length,0);assert.ok(size<=450_000,`${size} gzip bytes`);
});
