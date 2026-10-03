import { sprite2d } from "forgeng/2d";
import { FALLBACK_TEXTURE, MATERIAL, WORLD } from "./ids";

const ROAD_WIDTH = 27;
const ROAD_TOLERANCE = 4;
const SAMPLES_PER_CURVE = 10;

const CONTROL_POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 68], [115, 64], [155, 45],
  [165, 15], [150, -5], [110, -15], [35, -15],
  [-5, -18], [-35, -48], [-80, -72], [-130, -67],
  [-158, -40], [-152, -10], [-120, 18], [-88, 38],
  [-78, 58], [-30, 68],
];

const TRACK_POINTS = sampleClosedCurve(CONTROL_POINTS, SAMPLES_PER_CURVE);

export const START_POSITION: readonly [number, number] = TRACK_POINTS[0]!;
export const START_ANGLE = segmentAngle(TRACK_POINTS[0]!, TRACK_POINTS[1]!);

type Color = readonly [number, number, number, number];

interface Part {
  readonly id: string;
  readonly size: readonly [number, number];
  readonly position: readonly [number, number];
  readonly rotation: number;
  readonly tint: Color;
}

export function createTrackSprites() {
  const background: Part[] = [
    part("grass", [398, 223], [0, 0], 0, [0.07, 0.32, 0.19, 1]),
    part("pond", [43, 22], [20, 8], -0.2, [0.07, 0.34, 0.5, 1]),
  ];
  const road: Part[] = [];
  const markings: Part[] = [];

  for (let index = 0; index < TRACK_POINTS.length; index += 1) {
    const current = TRACK_POINTS[index]!;
    const next = TRACK_POINTS[(index + 1) % TRACK_POINTS.length]!;
    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const length = Math.hypot(dx, dy);
    const rotation = Math.atan2(dy, dx);
    const midpoint: readonly [number, number] = [(current[0] + next[0]) / 2, (current[1] + next[1]) / 2];
    road.push(part(`road-${index}`, [length + 3, ROAD_WIDTH], midpoint, rotation, [0.17, 0.2, 0.25, 1]));

    if (index % 10 === 0) {
      markings.push(part(`lane-${index}`, [7.5, 1.4], midpoint, rotation, [0.86, 0.85, 0.72, 0.86]));
    }
    const normal: readonly [number, number] = [-Math.sin(rotation), Math.cos(rotation)];
    const offset = ROAD_WIDTH / 2;
    const edgeColor: Color = Math.floor(index / 4) % 2 === 0
      ? [0.92, 0.16, 0.14, 1]
      : [0.96, 0.96, 0.91, 1];
    markings.push(part(`edge-a-${index}`, [length + 3, 2.2], [midpoint[0] + normal[0] * offset, midpoint[1] + normal[1] * offset], rotation, edgeColor));
    markings.push(part(`edge-b-${index}`, [length + 3, 2.2], [midpoint[0] - normal[0] * offset, midpoint[1] - normal[1] * offset], rotation, edgeColor));
  }

  addFinishLine(markings);
  addScenery(markings);
  return [...background, ...road, ...markings].map((item) => sprite2d({
    id: `template.2d:track-${item.id}`,
    entity: `template.2d:track-${item.id}-entity`,
    layer: WORLD,
    texture: FALLBACK_TEXTURE,
    material: MATERIAL,
    size: item.size,
    tint: item.tint,
    transform: { position: item.position, rotation: item.rotation, scale: [1, 1] },
  }));
}

export function isOnTrack(position: readonly [number, number]): boolean {
  const allowedDistance = ROAD_WIDTH / 2 + ROAD_TOLERANCE;
  return distanceToTrackSquared(position) <= allowedDistance * allowedDistance;
}

export function isCheckpoint(position: readonly [number, number], checkpoint: number): boolean {
  const checkpointIndices = [
    Math.round(TRACK_POINTS.length * 0.25),
    Math.round(TRACK_POINTS.length * 0.5),
    Math.round(TRACK_POINTS.length * 0.75),
    0,
  ] as const;
  const target = TRACK_POINTS[checkpointIndices[checkpoint] ?? 0]!;
  return squaredDistance(position, target) <= 22 * 22;
}

function distanceToTrackSquared(point: readonly [number, number]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < TRACK_POINTS.length; index += 1) {
    const distance = distanceToSegmentSquared(point, TRACK_POINTS[index]!, TRACK_POINTS[(index + 1) % TRACK_POINTS.length]!);
    if (distance < nearest) nearest = distance;
  }
  return nearest;
}

function distanceToSegmentSquared(point: readonly [number, number], start: readonly [number, number], end: readonly [number, number]): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : clamp(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared, 0, 1);
  return squaredDistance(point, [start[0] + dx * t, start[1] + dy * t]);
}

function sampleClosedCurve(points: ReadonlyArray<readonly [number, number]>, samplesPerCurve: number): ReadonlyArray<readonly [number, number]> {
  const samples: Array<readonly [number, number]> = [];
  for (let index = 0; index < points.length; index += 1) {
    const p0 = points[(index - 1 + points.length) % points.length]!;
    const p1 = points[index]!;
    const p2 = points[(index + 1) % points.length]!;
    const p3 = points[(index + 2) % points.length]!;
    for (let step = 0; step < samplesPerCurve; step += 1) {
      samples.push(catmullRom(p0, p1, p2, p3, step / samplesPerCurve));
    }
  }
  return samples;
}

function catmullRom(p0: readonly [number, number], p1: readonly [number, number], p2: readonly [number, number], p3: readonly [number, number], t: number): readonly [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

function addFinishLine(parts: Part[]): void {
  const centre = TRACK_POINTS[0]!;
  const rotation = START_ANGLE;
  const normal: readonly [number, number] = [-Math.sin(rotation), Math.cos(rotation)];
  for (let row = -3; row <= 3; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const offset = row * 4.4 + column * 2.2;
      const position: readonly [number, number] = [centre[0] + normal[0] * offset, centre[1] + normal[1] * offset];
      const white = (row + column) % 2 === 0;
      parts.push(part(`finish-${row + 3}-${column}`, [4.6, 4.6], position, rotation, white ? [0.98, 0.98, 0.94, 1] : [0.04, 0.05, 0.07, 1]));
    }
  }
}

function addScenery(parts: Part[]): void {
  const trees: ReadonlyArray<readonly [number, number]> = [[-70, -5], [75, 20], [4, 10]];
  trees.forEach(([x, y], index) => {
    parts.push(part(`tree-shadow-${index}`, [8, 8], [x + 2, y + 2], 0, [0.03, 0.16, 0.08, 0.58]));
    parts.push(part(`tree-${index}`, [7, 7], [x, y], Math.PI / 4, [0.19, 0.59, 0.29, 1]));
  });
}

function segmentAngle(start: readonly [number, number], end: readonly [number, number]): number { return Math.atan2(end[1] - start[1], end[0] - start[0]); }
function squaredDistance(a: readonly [number, number], b: readonly [number, number]): number { const dx = a[0] - b[0]; const dy = a[1] - b[1]; return dx * dx + dy * dy; }
function part(id: string, size: readonly [number, number], position: readonly [number, number], rotation: number, tint: Color): Part { return { id, size, position, rotation, tint }; }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }
