import type { Forge2dGame, Forge2dSceneDefinition, Forge2dSceneFacade } from "forgeng/presets/2d";
import type { UiShellLike } from "@forgeng/ui-dom";
import { Car } from "./car";
import { Controller, PlayerControls } from "./controller";
import { Hud } from "./hud";
import { CAR_ENTITY, SCENE_ID } from "./ids";
import { createRenderDefinition } from "./render";
import { isCheckpoint, isOnTrack } from "./track";

export class MainScene {
  private readonly car = new Car();
  private readonly controller = new Controller();
  private readonly hud = new Hud();
  private game: Forge2dGame | null = null;
  private scene: Forge2dSceneFacade | null = null;
  private checkpoint = 0;
  private lap = 0;
  private lapTime = 0;
  private bestLap: number | null = null;
  private resets = 0;
  private lastFrame = performance.now();
  private raf = 0;

  public definition(): Forge2dSceneDefinition {
    return { id: SCENE_ID, render: createRenderDefinition(this.car), colliders: [], setup: (scene) => { this.scene = scene; this.sync(scene); }, fixedUpdate: (scene) => this.fixedUpdate(scene) };
  }

  public bindGame(game: Forge2dGame): void {
    this.game = game;
    const ui = game.ui as UiShellLike | null;
    if (ui) this.hud.setup(ui, {
      getCanvasSize: () => ({ width: game.canvas.width, height: game.canvas.height }),
      getSceneId: () => SCENE_ID,
      getCarPosition: () => this.car.getPosition(),
      getSpeed: () => this.car.getSpeed(),
      getLap: () => this.lap,
      getLapTime: () => this.lapTime,
      getBestLap: () => this.bestLap,
      getResets: () => this.resets,
    });
    this.controller.setup(() => { this.reset(true); this.hud.notify("E — race reset"); });
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (Math.abs(this.car.getSpeed()) > 0.02) this.lapTime += dt;
      this.hud.update(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  public destroy(): void { cancelAnimationFrame(this.raf); this.controller.destroy(); this.hud.destroy(); this.game = null; this.scene = null; }

  private fixedUpdate(scene: Forge2dSceneFacade): void {
    if (!this.game) return;
    const drive = this.game.actions.value(PlayerControls.move) as readonly [number, number];
    this.car.drive(drive[0], drive[1]);
    if (!isOnTrack(this.car.getPosition())) {
      this.resets += 1;
      this.car.reset();
      this.checkpoint = 0;
      this.hud.notify("Off track — returned to the start", 2200);
    }
    this.checkLapProgress();
    this.sync(scene);
  }

  private checkLapProgress(): void {
    if (!isCheckpoint(this.car.getPosition(), this.checkpoint)) return;
    this.checkpoint += 1;
    if (this.checkpoint < 4) return;
    this.lap += 1;
    this.bestLap = this.bestLap === null ? this.lapTime : Math.min(this.bestLap, this.lapTime);
    this.hud.notify(`Lap ${this.lap} — ${formatTime(this.lapTime)}`, 3000);
    this.lapTime = 0;
    this.checkpoint = 0;
  }

  private reset(countReset: boolean): void {
    if (countReset) this.resets += 1;
    this.car.reset();
    this.checkpoint = 0;
    this.lapTime = 0;
    if (this.scene) this.sync(this.scene);
  }

  private sync(scene: Forge2dSceneFacade): void {
    scene.setTransform(CAR_ENTITY, { position: this.car.getPosition(), rotation: this.car.getAngle(), scale: [1, 1] });
    scene.hud.set("hud/status", Object.freeze({ lap: this.lap, speed: this.car.getSpeed(), checkpoint: this.checkpoint }));
    this.hud.setRaceStatus(this.lap, this.lapTime, this.bestLap, this.car.getSpeed());
  }
}

function formatTime(seconds: number): string { return `${seconds.toFixed(2)} s`; }
