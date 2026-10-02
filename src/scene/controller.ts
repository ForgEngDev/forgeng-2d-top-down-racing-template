import { binding, controls, defineActionMap } from "forgeng/contracts/actions";

export const ACTIVE_CONTROLS = [
  { id: "drive", label: "Keyboard · W / S", help: "Accelerate / brake / reverse" },
  { id: "steer", label: "Keyboard · A / D", help: "Steer left / right" },
  { id: "arrows", label: "Keyboard · Arrow keys", help: "Same driving controls" },
  { id: "reset", label: "Keyboard · E", help: "Reset at the start line" },
] as const;

export const PlayerControls = defineActionMap({
  id: "template.2d:driver-controls",
  actions: {
    move: { kind: "vector2", bindings: [
      binding.vector2({ id: "wasd", up: controls.key("KeyW"), down: controls.key("KeyS"), left: controls.key("KeyA"), right: controls.key("KeyD") }),
      binding.vector2({ id: "arrows", up: controls.key("ArrowUp"), down: controls.key("ArrowDown"), left: controls.key("ArrowLeft"), right: controls.key("ArrowRight") }),
    ] },
  },
});

export class Controller {
  private onKeyDown: ((event: KeyboardEvent) => void) | null = null;
  public setup(onReset: () => void): void {
    this.destroy();
    this.onKeyDown = (event) => {
      if (event.code === "KeyE" && !event.repeat) { event.preventDefault(); onReset(); }
    };
    window.addEventListener("keydown", this.onKeyDown);
  }
  public destroy(): void {
    if (this.onKeyDown) window.removeEventListener("keydown", this.onKeyDown);
    this.onKeyDown = null;
  }
}
