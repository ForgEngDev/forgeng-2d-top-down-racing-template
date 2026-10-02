import { sprite2d } from "forgeng/2d";
import { FALLBACK_TEXTURE, MATERIAL, WORLD } from "./ids";

const PARTS = [
  { id: "grass", size: [310, 170], position: [0, 0], tint: [0.12, 0.36, 0.22, 1] },
  { id: "asphalt", size: [276, 142], position: [0, 0], tint: [0.2, 0.24, 0.3, 1] },
  { id: "island", size: [142, 62], position: [0, 0], tint: [0.13, 0.39, 0.23, 1] },
  { id: "finish-a", size: [5, 9], position: [-70, 43], tint: [0.96, 0.96, 0.96, 1] },
  { id: "finish-b", size: [5, 9], position: [-65, 52], tint: [0.96, 0.96, 0.96, 1] },
  { id: "finish-c", size: [5, 9], position: [-65, 43], tint: [0.08, 0.1, 0.14, 1] },
  { id: "finish-d", size: [5, 9], position: [-70, 52], tint: [0.08, 0.1, 0.14, 1] },
] as const;

export function createTrackSprites() {
  return PARTS.map((part) => sprite2d({ id: `template.2d:track-${part.id}`, entity: `template.2d:track-${part.id}-entity`, layer: WORLD, texture: FALLBACK_TEXTURE, material: MATERIAL, size: part.size, tint: part.tint, transform: { position: part.position, rotation: 0, scale: [1, 1] } }));
}

export function isOnTrack(position: readonly [number, number]): boolean {
  const [x, y] = position;
  return Math.abs(x) <= 136 && Math.abs(y) <= 70 && !(Math.abs(x) < 72 && Math.abs(y) < 32);
}
