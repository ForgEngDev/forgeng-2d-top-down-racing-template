import { sprite2d } from "forgeng/2d";
import { CAR, CAR_ENTITY, FALLBACK_TEXTURE, MATERIAL, WORLD } from "./ids";

const START: readonly [number, number] = [-88, 47];

export class Car {
  private position: readonly [number, number] = START;
  private angle = 0;
  private speed = 0;

  public createSprite() {
    return sprite2d({ id: CAR, entity: CAR_ENTITY, layer: WORLD, texture: FALLBACK_TEXTURE, material: MATERIAL, size: [18, 10], tint: [1, 0.42, 0.16, 1], transform: { position: this.position, rotation: this.angle, scale: [1, 1] } });
  }

  public drive(steering: number, throttle: number): void {
    if (throttle > 0) this.speed += 0.1 * throttle;
    else if (throttle < 0) this.speed += 0.075 * throttle;
    else this.speed *= 0.965;
    this.speed = clamp(this.speed, -1.25, 3.0);
    if (Math.abs(this.speed) < 0.015) this.speed = 0;
    const grip = Math.min(1, Math.abs(this.speed) / 0.8);
    this.angle += steering * 0.052 * grip * (this.speed >= 0 ? 1 : -1);
    this.position = [this.position[0] + Math.cos(this.angle) * this.speed, this.position[1] + Math.sin(this.angle) * this.speed];
  }

  public reset(position: readonly [number, number] = START, angle = 0): void { this.position = position; this.angle = angle; this.speed = 0; }
  public getPosition(): readonly [number, number] { return this.position; }
  public getAngle(): number { return this.angle; }
  public getSpeed(): number { return this.speed; }
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
