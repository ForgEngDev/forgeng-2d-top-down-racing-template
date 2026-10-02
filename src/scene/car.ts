import { sprite2d } from "forgeng/2d";
import { CAR, CAR_ENTITY, FALLBACK_TEXTURE, MATERIAL, WORLD } from "./ids";
import { START_ANGLE, START_POSITION } from "./track";

export class Car {
  private position: readonly [number, number] = START_POSITION;
  private angle = START_ANGLE;
  private speed = 0;

  public createSprite() {
    return sprite2d({ id: CAR, entity: CAR_ENTITY, layer: WORLD, texture: FALLBACK_TEXTURE, material: MATERIAL, size: [11, 6], tint: [1, 0.42, 0.16, 1], transform: { position: this.position, rotation: this.angle, scale: [1, 1] } });
  }

  public drive(steering: number, throttle: number): void {
    if (throttle > 0) this.speed += 0.045 * throttle;
    else if (throttle < 0) this.speed += 0.065 * throttle;
    else this.speed *= 0.975;
    this.speed = clamp(this.speed, -0.7, 1.7);
    if (Math.abs(this.speed) < 0.012) this.speed = 0;
    const grip = Math.min(1, Math.abs(this.speed) / 0.55);
    this.angle += steering * 0.043 * grip * (this.speed >= 0 ? 1 : -1);
    this.position = [this.position[0] + Math.cos(this.angle) * this.speed, this.position[1] + Math.sin(this.angle) * this.speed];
  }

  public reset(position: readonly [number, number] = START_POSITION, angle = START_ANGLE): void { this.position = position; this.angle = angle; this.speed = 0; }
  public getPosition(): readonly [number, number] { return this.position; }
  public getAngle(): number { return this.angle; }
  public getSpeed(): number { return this.speed; }
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
