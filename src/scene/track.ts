import { sprite2d } from "forgeng/2d";
import { FALLBACK_TEXTURE, MATERIAL, WORLD } from "./ids";

const RADIUS_X = 150;
const RADIUS_Y = 72;
const SEGMENT_COUNT = 72;
const ROAD_INNER = 0.76;
const ROAD_OUTER = 1.24;

type Color = readonly [number, number, number, number];

interface Part {
  readonly id: string;
  readonly size: readonly [number, number];
  readonly position: readonly [number, number];
  readonly rotation: number;
  readonly tint: Color;
}

export function createTrackSprites() {
  const parts: Part[] = [
    part("grass", [398, 223], [0, 0], 0, [0.08, 0.31, 0.17, 1]),
    part("infield", [112, 54], [0, 0], 0, [0.1, 0.37, 0.2, 1]),
    part("pond", [43, 21], [22, 2], -0.18, [0.08, 0.34, 0.48, 1]),
  ];

  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    const angle = (index / SEGMENT_COUNT) * Math.PI * 2;
    const position = ellipsePoint(angle, 1);
    const rotation = tangentAngle(angle);
    parts.push(part(`road-${index}`, [18, 36], position, rotation, [0.19, 0.22, 0.27, 1]));

    if (index % 4 === 0) {
      parts.push(part(`lane-${index}`, [9, 1.5], position, rotation, [0.78, 0.79, 0.72, 0.82]));
    }
    if (index % 2 === 0) {
      const curbColor: Color = index % 4 === 0 ? [0.92, 0.19, 0.16, 1] : [0.95, 0.95, 0.9, 1];
      parts.push(part(`outer-curb-${index}`, [11, 3], ellipsePoint(angle, 1.22), rotation, curbColor));
      parts.push(part(`inner-curb-${index}`, [9, 3], ellipsePoint(angle, 0.78), rotation, curbColor));
    }
  }

  addFinishLine(parts);
  addInfieldDetails(parts);

  return parts.map((item) => sprite2d({
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

/** A forgiving elliptical road band that matches the visual track. */
export function isOnTrack(position: readonly [number, number]): boolean {
  const normalizedRadius = Math.hypot(position[0] / RADIUS_X, position[1] / RADIUS_Y);
  return normalizedRadius >= ROAD_INNER && normalizedRadius <= ROAD_OUTER;
}

function ellipsePoint(angle: number, scale: number): readonly [number, number] {
  return [Math.cos(angle) * RADIUS_X * scale, Math.sin(angle) * RADIUS_Y * scale];
}

function tangentAngle(angle: number): number {
  return Math.atan2(RADIUS_Y * Math.cos(angle), -RADIUS_X * Math.sin(angle));
}

function part(id: string, size: readonly [number, number], position: readonly [number, number], rotation: number, tint: Color): Part {
  return { id, size, position, rotation, tint };
}

function addFinishLine(parts: Part[]): void {
  const angle = 2;
  const centre = ellipsePoint(angle, 1);
  const tangent = tangentAngle(angle);
  const normal: readonly [number, number] = [-Math.sin(tangent), Math.cos(tangent)];
  for (let row = -3; row <= 3; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const offset = row * 4.2 + column * 2.1;
      const position: readonly [number, number] = [centre[0] + normal[0] * offset, centre[1] + normal[1] * offset];
      const white = (row + column) % 2 === 0;
      parts.push(part(`finish-${row + 3}-${column}`, [4.5, 4.5], position, tangent, white ? [0.97, 0.97, 0.94, 1] : [0.04, 0.05, 0.07, 1]));
    }
  }
}

function addInfieldDetails(parts: Part[]): void {
  const trees: ReadonlyArray<readonly [number, number]> = [[-43, -14], [-18, 19], [55, -18], [65, 14], [-64, 7]];
  trees.forEach(([x, y], index) => {
    parts.push(part(`tree-shadow-${index}`, [8, 8], [x + 2, y + 2], 0, [0.04, 0.17, 0.09, 0.55]));
    parts.push(part(`tree-${index}`, [7, 7], [x, y], Math.PI / 4, [0.2, 0.58, 0.27, 1]));
  });
}
