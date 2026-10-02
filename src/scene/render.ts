import { builtinSpriteMaterial2d, defineLayer2d, defineRender2d } from "forgeng/2d";
import { Car } from "./car";
import { createCamera } from "./camera";
import { MATERIAL, WORLD } from "./ids";
import { createTrackSprites } from "./track";

export function createRenderDefinition(car: Car) {
  return defineRender2d({
    contractVersion: 1,
    id: "template.2d:racing-render",
    layers: [defineLayer2d({ id: WORLD })],
    cameras: [createCamera()],
    materials: [builtinSpriteMaterial2d({ id: MATERIAL })],
    sprites: [...createTrackSprites(), car.createSprite()],
    animations: [],
  });
}
