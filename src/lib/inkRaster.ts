/** Color-independent pigment geometry shared by the worker and compatibility path. */
export const INK = {
    duration: 780,
    midpoint: 390,
    frames: 64,
    columns: 8,
    resolution: 480,
    maxAtlasPixels: 10_500_000,
    smallAtlasPixels: 6_000_000,
    feather: .006,
    edgePixels: 1.25,
    displacement: .14,
    droplets: 32,
    tendrils: 11,
    merge: .012,
    growthPower: 1.25,
    coverageAt: .94,
};

export interface InkRequest { width: number; height: number; x: number; y: number }
export interface InkRaster {
    blob: Blob;
    keyframes: Keyframe[];
    size: string;
    tileWidth: number;
    tileHeight: number;
}
export interface InkSurface {
    context: Pick<CanvasRenderingContext2D, "createImageData" | "putImageData">;
    encode: () => Promise<Blob>;
    dispose: () => void;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
const hash = (x: number, y: number) => {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
function noise(x: number, y: number) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
    return (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy)
        + (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy;
}
function join(a: number, b: number) {
    const h = Math.max(INK.merge - Math.abs(a - b), 0) / INK.merge;
    return Math.min(a, b) - h * h * INK.merge * .25;
}

export function inkGeometry({ width, height, x, y }: InkRequest) {
    const rows = Math.ceil(INK.frames / INK.columns);
    const budget = width < 768 ? INK.smallAtlasPixels : INK.maxAtlasPixels;
    const scale = Math.min(1, INK.resolution / Math.max(width, height), Math.sqrt(budget / (width * height * INK.columns * rows)));
    const w = Math.max(1, Math.floor(width * scale)), h = Math.max(1, Math.floor(height * scale));
    return { w, h, ox: x * w / width, oy: y * h / height, rows, budget };
}

type Capillary = { x: number; y: number; breadth: number; time: number };

/** A capsule's arrival gradient gives each vein a continuous tapered silhouette.
 * The outer barrier returns to the substrate field before the raster bounds.
 */
function depositSegment(field: Float32Array, w: number, h: number, a: Capillary, b: Capillary) {
    const extent = Math.max(a.breadth, b.breadth) * 2;
    const left = Math.max(0, Math.floor(Math.min(a.x, b.x) - extent));
    const right = Math.min(w - 1, Math.ceil(Math.max(a.x, b.x) + extent));
    const top = Math.max(0, Math.floor(Math.min(a.y, b.y) - extent));
    const bottom = Math.min(h - 1, Math.ceil(Math.max(a.y, b.y) + extent));
    const vx = b.x - a.x, vy = b.y - a.y, length2 = Math.max(.001, vx * vx + vy * vy);
    for (let py = top; py <= bottom; py++) for (let px = left; px <= right; px++) {
        const t = clamp(((px - a.x) * vx + (py - a.y) * vy) / length2);
        const breadth = a.breadth + (b.breadth - a.breadth) * t;
        const distance = Math.hypot(px - a.x - vx * t, py - a.y - vy * t) / breadth;
        if (distance >= 2) continue;
        const arrival = a.time + (b.time - a.time) * t + distance * distance * .028 + .6 * smooth((distance - .75) / 1.25);
        const index = py * w + px;
        field[index] = join(field[index], arrival);
    }
}

export async function rasterizeInk(
    request: InkRequest,
    surface: (width: number, height: number) => InkSurface,
    signal: AbortSignal,
    cooperative = true,
): Promise<InkRaster> {
    signal.throwIfAborted();
    const { w, h, ox, oy, rows } = inkGeometry(request);
    const radius = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
    const density = INK.resolution / Math.max(w, h);
    const pause = async () => {
        if (cooperative) await new Promise<void>(resolve => setTimeout(resolve, 0));
        signal.throwIfAborted();
    };
    const field = new Float32Array(w * h);
    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const u = px * density, v = py * density;
            const warpX = (noise(u / 92 + 11, v / 92 + 23) - .5) * 30;
            const warpY = (noise(u / 92 + 91, v / 92 + 57) - .5) * 30;
            const n = (noise((u + warpX) / 61, (v + warpY) / 61) - .5) * .58
                + (noise((u + warpX) / 22 + 17, (v + warpY) / 22) - .5) * .29
                + (noise(u / 8, v / 8 + 41) - .5) * .13;
            const dx = px - ox, dy = py - oy, distance = Math.hypot(dx, dy), r = distance / radius;
            const angle = Math.atan2(dy, dx), logicalDistance = distance * density;
            const contour = .065 * Math.sin(angle * 7 + n * 4 + logicalDistance / 63)
                + .032 * Math.sin(angle * 19 - logicalDistance / 38 + warpX * .02);
            field[py * w + px] = r * (1 + contour) + n * INK.displacement * Math.sqrt(r);
        }
        if (py % 16 === 15) await pause();
    }

    // Unequal spacing, speed, bend and fork birth avoid a radial comb pattern.
    for (let arm = 0; arm < INK.tendrils; arm++) {
        const base = (arm + .1 + hash(arm, 11) * .8) * Math.PI * 2 / INK.tendrils;
        const forkAt = .18 + hash(arm, 27) * .12;
        const spread = .22 + hash(arm, 13) * .2;
        const bend = (hash(arm, 39) - .5) * .5;
        const phase = hash(arm, 17) * Math.PI * 2;
        const speed = .94 + hash(arm, 57) * .035;
        const steps = Math.max(48, Math.ceil(radius * 1.15 / 2));
        for (const fork of [-1, 0, 1]) {
            if (fork && hash(arm, fork + 49) < .25) continue;
            let previous: Capillary | undefined;
            for (let step = 0; step <= steps; step++) {
                const s = .025 + step / steps * 1.125;
                if (fork && s < forkAt) continue;
                const angle = base + bend * smooth(s / 1.1)
                    + (.1 + hash(arm, 7) * .12) * Math.sin(s * (7 + hash(arm, 5) * 5) + phase) * smooth(s / .25)
                    + fork * smooth((s - forkAt) / .58) * spread;
                const point = {
                    x: ox + Math.cos(angle) * s * radius,
                    y: oy + Math.sin(angle) * s * radius,
                    breadth: (3.2 + hash(arm, 73) * 2.6) * (1 - .4 * Math.min(1, s)) * (fork ? .78 : 1) / density,
                    time: s * speed,
                };
                if (previous) depositSegment(field, w, h, previous, point);
                previous = point;
            }
        }
        await pause();
    }

    // A few leading drops plus smaller satellites; smooth minima form liquid necks.
    for (let i = 0; i < INK.droplets; i++) {
        const px = hash(i + 1, 18) * (w - 1), py = hash(i + 1, 91) * (h - 1);
        const birth = field[Math.floor(py) * w + Math.floor(px)] - .055 - hash(i + 1, 4) * .04;
        if (birth < .09) continue;
        const rx = (i % 7 === 0 ? 5 + hash(i, 12) * 2 : 1.2 + hash(i, 12) * 3.3) / density;
        const ry = rx * (.75 + hash(i, 7) * .55);
        for (let yy = Math.max(0, Math.floor(py - ry * 2)); yy < Math.min(h, py + ry * 2); yy++)
            for (let xx = Math.max(0, Math.floor(px - rx * 2)); xx < Math.min(w, px + rx * 2); xx++) {
                const distance = Math.hypot((xx - px) / rx, (yy - py) / ry);
                if (distance >= 2) continue;
                const candidate = birth + distance * .027 + .55 * smooth((distance - .8) / 1.2);
                const index = yy * w + xx;
                field[index] = join(field[index], candidate);
            }
    }

    // Guarantee an antialiased band even where a thin branch has a steep gradient.
    const edges = new Float32Array(field.length);
    let farthest = 0;
    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const index = py * w + px;
            const gx = (field[py * w + Math.min(w - 1, px + 1)] - field[py * w + Math.max(0, px - 1)]) * .5;
            const gy = (field[Math.min(h - 1, py + 1) * w + px] - field[Math.max(0, py - 1) * w + px]) * .5;
            edges[index] = Math.max(INK.feather, Math.hypot(gx, gy) * INK.edgePixels);
            farthest = Math.max(farthest, field[index] + edges[index] * .5);
        }
        if (py % 24 === 23) await pause();
    }
    signal.throwIfAborted();
    const raster = surface(w * INK.columns, h * rows);
    try {
        const tile = raster.context.createImageData(w, h); tile.data.fill(255);
        const keyframes: Keyframe[] = [];
        for (let frame = 0; frame < INK.frames; frame++) {
            const t = frame / (INK.frames - 1), u = Math.min(1, t / INK.coverageAt);
            const growth = (1 - Math.pow(1 - u, INK.growthPower)) * (farthest + INK.feather);
            for (let i = 0; i < field.length; i++) {
                const d = (growth - field[i]) / edges[i] + .5;
                tile.data[i * 4 + 3] = frame === 0 ? 0 : d <= 0 ? 0 : d >= 1 ? 255 : Math.round(255 * d * d * (3 - 2 * d));
            }
            const col = frame % INK.columns, row = Math.floor(frame / INK.columns);
            raster.context.putImageData(tile, col * w, row * h);
            keyframes.push({ maskPosition: `${col * 100 / (INK.columns - 1)}% ${row * 100 / (rows - 1)}%`, offset: t, easing: "steps(1, end)" });
            if (frame % 4 === 3) await pause();
        }
        const blob = await raster.encode(); signal.throwIfAborted();
        return { blob, keyframes, size: `${INK.columns * 100}% ${rows * 100}%`, tileWidth: w, tileHeight: h };
    } finally { raster.dispose(); }
}
