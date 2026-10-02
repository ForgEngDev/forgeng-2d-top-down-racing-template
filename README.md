# ForgEng 2D Top-Down Racing Template

**Live demo:** [play.forgeng.dev/forgeng-2d-top-down-racing-template/current/](https://play.forgeng.dev/forgeng-2d-top-down-racing-template/current/)

A compact top-down racing starter built with **ForgeNG 3.4.2**, TypeScript, WebGPU, and Vite. Accelerate, brake, steer through four ordered checkpoints, record lap times, and recover automatically after leaving the track.

## Quick start

```bash
git clone https://github.com/ForgEngDev/forgeng-2d-top-down-racing-template.git
cd forgeng-2d-top-down-racing-template
npm install
npm run dev
```

Open the local URL printed by Vite in a WebGPU-capable browser.

## Included

- arcade acceleration, braking, reverse, friction, and speed-aware steering
- large flowing circuit with kerbs, a start line, ordered checkpoints, lap time, and best lap
- automatic off-track recovery and manual reset
- 320×180 integer-fit camera
- English controls panel and optional metrics (`?advanced=1`)
- vendored ForgeNG 3.4.2 browser runtime

## Controls

| Input | Action |
| --- | --- |
| W / Up | Accelerate |
| S / Down | Brake or reverse |
| A/D or Left/Right | Steer |
| E | Reset at the start line |

## Project layout

```text
src/scene/
  mainScene.ts   # race loop, checkpoints, lap timing
  car.ts         # arcade vehicle movement
  track.ts       # track sprites and bounds
  controller.ts  # semantic driving input
  render.ts      # ForgeNG 2D render definition
  hud.ts         # controls, metrics, lap overlay
```

## Build

```bash
npm run build
npm run preview
```

## More ForgEng templates

- [Top-Down 2D](https://github.com/ForgEngDev/forgeng-2d-top-down-template)
- [2D Platformer](https://github.com/ForgEngDev/forgeng-2d-platformer-template)
- [2D Endless Flyer](https://github.com/ForgEngDev/forgeng-2d-endless-flyer-template)
- [2D Space Shooter](https://github.com/ForgEngDev/forgeng-2d-space-shooter-template)
- [3D Platformer](https://github.com/ForgEngDev/forgeng-3d-template)

Documentation: [forgeng.dev](https://forgeng.dev)

## License

See [LICENSE](./LICENSE). Template/game code is available for client-side game projects. The vendored ForgEng engine remains subject to the ForgeNG license; commercial engine use or installing the engine/SDK on other computers is not permitted without authorization.


## Public API and AI coding assistants

See the [ForgeNG public API repository](https://github.com/ForgEngDev/forgeng-api) for versioned TypeScript signatures, an API entry map, and [instructions for AI assistants](https://github.com/ForgEngDev/forgeng-api/blob/main/AGENTS.md). Give your assistant that link together with this game project. This template's pinned runtime and vendored declarations take precedence over a newer API snapshot. Start with one change and run `npm run build`, then check the game in a WebGPU browser.
