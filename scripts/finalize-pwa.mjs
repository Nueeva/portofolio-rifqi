import { readFileSync,writeFileSync } from "node:fs";
import { generateSW } from "workbox-build";
import { pwaOptions } from "./pwa-options.mjs";
const html=readFileSync("dist/index.html","utf8");const critical=new Set();
function collect(file){if(critical.has(file))return;critical.add(file);const source=readFileSync("dist/"+file,"utf8");for(const m of source.matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g))collect("assets/"+m[1]);}
for(const match of html.matchAll(/(?:src|href)="\/(assets\/[^" ]+\.(?:js|css))"/g)){if(match[1].endsWith("js"))collect(match[1]);else critical.add(match[1]);}
writeFileSync("dist/manifest.webmanifest",JSON.stringify(pwaOptions.manifest));
writeFileSync("dist/registerSW.js",'if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));}');
const result=await generateSW({...pwaOptions.workbox,globDirectory:"dist",swDest:"dist/sw.js",globPatterns:[...critical,"**/*.html","fonts/*.{woff2,ttf}","*.{ico,png,svg}","manifest.webmanifest","registerSW.js"],navigateFallback:"index.html"});
console.log(`finalize-pwa: ${result.count} final assets, ${result.size} bytes`);
for(const warning of result.warnings) console.warn(warning);
