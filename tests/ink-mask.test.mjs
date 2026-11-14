import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Read the real alpha output from the shared rasterizer, without a browser/GPU.
function generator() {
    const tiles = []; let disposed = 0, allocated = 0;
    const context = {
        createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: tile => tiles.push(Uint8Array.from({ length: tile.data.length / 4 }, (_, i) => tile.data[i * 4 + 3])),
    };
    const source = ts.transpile(readFileSync(new URL("../src/lib/inkRaster.ts", import.meta.url), "utf8"), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
    const exports = {};
    new Function("exports", source)(exports);
    const surface = () => { allocated++; return { context, encode: async () => new Blob(["ink"]), dispose: () => disposed++ }; };
    return { ...exports, tiles, surface, disposed: () => disposed, allocated: () => allocated };
}

test("ink is empty at start, opaque at its origin, feathered at the front and fully covered before cleanup", async () => {
    const g = generator(), request = { width: 480, height: 300, x: 450, y: 25 };
    const { w, h, ox, oy } = g.inkGeometry(request);
    const raster = await g.rasterizeInk(request, g.surface, new AbortController().signal, false);
    assert.equal(g.tiles.length, g.INK.frames);
    assert.equal(raster.keyframes.length, 64);
    assert.ok(g.tiles[0].every(alpha => alpha === 0));
    assert.ok(g.tiles.at(-1).every(alpha => alpha === 255));
    assert.ok(g.tiles.at(-2).every(alpha => alpha === 255));
    assert.equal(g.tiles[16][Math.floor(oy) * w + Math.floor(ox)], 255);
    assert.equal(g.tiles[16][(h - 1) * w], 0);
    assert.ok(g.tiles[28].some(alpha => alpha > 0 && alpha < 255));
    assert.equal(g.disposed(), 1);
});

test("ink keeps a coherent body with detached drops during its portrait expansion", async () => {
    const g = generator(), request = { width: 300, height: 480, x: 270, y: 25 };
    const { w } = g.inkGeometry(request);
    await g.rasterizeInk(request, g.surface, new AbortController().signal, false);
    const components = [];
    for (const frame of [16, 24, 32, 40]) {
        const tile = g.tiles[frame], visited = new Uint8Array(tile.length), sizes = [];
        for (let index = 0; index < tile.length; index++) {
            if (visited[index] || tile[index] < 128) continue;
            const stack = [index]; visited[index] = 1; let size = 0;
            while (stack.length) {
                const i = stack.pop(); size++;
                const adjacent = [i - w, i + w];
                if (i % w) adjacent.push(i - 1);
                if (i % w < w - 1) adjacent.push(i + 1);
                for (const next of adjacent) if (next >= 0 && next < tile.length && !visited[next] && tile[next] >= 128) { visited[next] = 1; stack.push(next); }
            }
            sizes.push(size);
        }
        components.push(sizes);
    }
    assert.ok(components.some(sizes => Math.max(...sizes) > 10000));
    assert.ok(components.some(sizes => sizes.filter(size => size >= 3).length > 2));
    assert.ok(g.tiles.at(-1).every(alpha => alpha === 255));
});

test("atlas geometry respects mobile/desktop pixel and texture bounds at unusual ratios", () => {
    const g = generator();
    for (const [width, height] of [[390, 844], [420, 1200], [1600, 420], [1920, 1920], [7680, 4320]]) {
        const { w, h, rows, budget } = g.inkGeometry({ width, height, x: width - 30, y: 32 });
        assert.ok(w * h * rows * g.INK.columns <= budget);
        assert.ok(w * g.INK.columns <= 4096 && h * rows <= 4096);
    }
});

test("cancelled rasterization does not allocate a canvas", async () => {
    const g = generator(), controller = new AbortController(); controller.abort();
    await assert.rejects(g.rasterizeInk({ width: 100, height: 100, x: 50, y: 50 }, g.surface, controller.signal), { name: "AbortError" });
    assert.equal(g.allocated(), 0);
});

test("failed encoding releases the atlas surface", async () => {
    const g = generator(); let disposed = false;
    await assert.rejects(g.rasterizeInk({ width: 100, height: 100, x: 80, y: 20 }, () => ({ ...g.surface(), encode: async () => { throw new Error("encoding failed"); }, dispose: () => { disposed = true; } }), new AbortController().signal, false), /encoding failed/);
    assert.equal(disposed, true);
});
