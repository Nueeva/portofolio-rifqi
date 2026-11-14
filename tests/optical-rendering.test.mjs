import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function mount() {
  const frames = new Map(); let sequence = 0; let cleanup; let progressChange;
  const listeners = new Map(); const observers = [];
  const calls = { render: 0, dispose: 0, theme: 0 };
  const element = { append() {}, dataset: {}, parentElement: { addEventListener(k,v) { listeners.set(k,v); }, removeEventListener() {} }, getBoundingClientRect: () => ({width:1440,height:900,left:0,top:0}) };
  const canvas = { setAttribute() {}, style:{}, addEventListener(k,v) { listeners.set(k,v); }, removeEventListener() {}, remove() {} };
  class Resource { constructor() { this.domElement=canvas; } dispose() { calls.dispose++; } set() {} setSize() {} setPixelRatio() {} setRenderTarget() {} render() { calls.render++; } add() {} }
  class Material extends Resource { constructor(options) { super(); Object.assign(this, options); } }
  class Observer { constructor(fn) { this.fn=fn; observers.push(this); } observe() {} disconnect() {} }
  const document = { hidden:false, documentElement:{}, addEventListener(k,v) { listeners.set(k,v); }, removeEventListener() {} };
  const env = { useRef:()=>({current:element}), useEffect:fn=>{cleanup=fn();}, jsx:()=>null,
    Color:Resource, Mesh:Resource, OrthographicCamera:Resource, PlaneGeometry:Resource, Scene:Resource, ShaderMaterial:Material, Vector2:Resource, WebGLRenderer:Resource, WebGLRenderTarget:Resource,
    ResizeObserver:Observer, IntersectionObserver:Observer, MutationObserver:Observer,
    requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;}, cancelAnimationFrame:id=>frames.delete(id),
    devicePixelRatio:1.5, performance:{now:()=>0}, document,
    window:{dispatchEvent:()=>{calls.theme++;}}, Event:class {}, getComputedStyle:()=>({getPropertyValue:()=> '#112233'}) };
  let source=readFileSync(new URL('../src/components/public/OpticalField.tsx',import.meta.url),'utf8');
  source=source.replace(/^import .*;\r?\n/gm,'').replace('export default function','function');
  const output=ts.transpile(source,{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}).replace(/^import .*;\r?\n/gm,'').replaceAll('_jsx(', 'jsx(');
  new Function(...Object.keys(env), output+'\nreturn OpticalField;')(...Object.values(env))({progress:{get:()=>0,on:(_,fn)=>{progressChange=fn;return ()=>{};}}});
  const flush=()=>{const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn());};
  return { calls, frames, flush, observers, listeners, document, change:()=>progressChange(.5), cleanup:()=>cleanup() };
}

test('optical updates coalesce, cache the background and stop at idle',()=>{
 const h=mount(); h.flush(); assert.equal(h.calls.render,2); assert.equal(h.calls.theme,1); assert.equal(h.frames.size,0);
 h.change();h.change();h.change();assert.equal(h.frames.size,1);h.flush();assert.equal(h.calls.render,3);assert.equal(h.calls.theme,1);assert.equal(h.frames.size,0);
 h.observers[2].fn();h.flush();assert.equal(h.calls.render,5);assert.equal(h.calls.theme,2);
 h.observers[0].fn();h.flush();assert.equal(h.calls.render,7);h.cleanup();assert.equal(h.frames.size,0);assert.equal(h.calls.dispose,5);
});
test('hidden and offscreen updates resume with one latest frame; loss stops rendering',()=>{
 const h=mount();h.flush();h.change();h.observers[1].fn([{isIntersecting:false}]);assert.equal(h.frames.size,0);h.change();assert.equal(h.frames.size,0);
 h.observers[1].fn([{isIntersecting:true}]);assert.equal(h.frames.size,1);h.flush();
 h.document.hidden=true;h.listeners.get('visibilitychange')();h.change();assert.equal(h.frames.size,0);
 h.document.hidden=false;h.listeners.get('visibilitychange')();assert.equal(h.frames.size,1);h.flush();
 h.listeners.get('webglcontextlost')({preventDefault(){}});h.change();assert.equal(h.frames.size,0);h.cleanup();
});
