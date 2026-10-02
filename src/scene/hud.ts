import type { UiDisposable, UiShellLike } from "@forgeng/ui-dom";
import { ACTIVE_CONTROLS } from "./controller";

export interface MetricsSource {
  getCanvasSize(): { width: number; height: number };
  getSceneId(): string;
  getCarPosition(): readonly [number, number];
  getSpeed(): number;
  getLap(): number;
  getLapTime(): number;
  getBestLap(): number | null;
  getResets(): number;
}

export class Hud {
  private readonly disposers: UiDisposable[] = [];
  private ui: UiShellLike | null = null;
  private source: MetricsSource | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private overlayEl: HTMLElement | null = null;
  private lapEl: HTMLElement | null = null;
  private speedEl: HTMLElement | null = null;
  private toastEl: HTMLElement | null = null;
  private notifyTimer: ReturnType<typeof setTimeout> | null = null;
  private advanced = false;
  private fps = 0;
  private frames = 0;
  private fpsTimer = 0;

  public setup(ui: UiShellLike, source: MetricsSource): void {
    this.destroy(); this.ui = ui; this.source = source;
    this.advanced = new URLSearchParams(window.location.search).has("advanced");
    this.installUiStyle(ui); this.applyAdvanced(); this.ensureOverlay();
    this.disposers.push(ui.settings.register({ id: "template.controls", title: "Controls", fields: [
      { id: "status", label: "Status", kind: "status", read: () => `Racing · ${this.fps} FPS` },
      ...ACTIVE_CONTROLS.map((control) => ({ id: `ctrl-${control.id}`, label: control.label, kind: "status" as const, read: () => control.help })),
      { id: "advanced", label: "Advanced metrics", kind: "boolean", read: () => this.advanced, write: (value: string | number | boolean | null) => { this.advanced = value === true; this.applyAdvanced(); this.syncUrl(); ui.settings.refresh("template.controls"); } },
      { id: "tip", label: "Goal", kind: "status", read: () => "Pass all four checkpoints in order" },
    ] }));
    this.disposers.push(ui.contributions.register({ id: "template.controls.panel", title: "Controls", slot: "side-panel", order: 10, settingsSchemaId: "template.controls" }));
    this.disposers.push(ui.settings.register({ id: "template.metrics", title: "Metrics", fields: [
      { id: "fps", label: "FPS", kind: "status", read: () => String(this.fps) },
      { id: "scene", label: "Scene", kind: "status", read: () => this.source?.getSceneId() ?? "—" },
      { id: "car", label: "Car XY", kind: "status", read: () => { const p = this.source?.getCarPosition(); return p ? `${p[0].toFixed(0)}, ${p[1].toFixed(0)}` : "—"; } },
      { id: "speed", label: "Speed", kind: "status", read: () => `${Math.abs(this.source?.getSpeed() ?? 0).toFixed(2)}` },
      { id: "lap", label: "Lap / time", kind: "status", read: () => `${this.source?.getLap() ?? 0} / ${(this.source?.getLapTime() ?? 0).toFixed(2)} s` },
      { id: "best", label: "Best lap", kind: "status", read: () => this.source?.getBestLap()?.toFixed(2) ?? "—" },
      { id: "resets", label: "Resets", kind: "status", read: () => String(this.source?.getResets() ?? 0) },
      { id: "resolution", label: "Resolution", kind: "status", read: () => { const s = this.source?.getCanvasSize(); return s ? `${s.width}×${s.height}` : "—"; } },
    ] }));
    this.disposers.push(ui.contributions.register({ id: "template.metrics.panel", title: "Metrics", slot: "side-panel", order: 20, settingsSchemaId: "template.metrics" }));
  }

  public update(dt: number): void {
    this.frames += 1; this.fpsTimer += dt;
    if (this.fpsTimer < 0.5) return;
    this.fps = Math.round(this.frames / this.fpsTimer); this.frames = 0; this.fpsTimer = 0;
    this.ui?.settings.refresh("template.controls"); if (this.advanced) this.ui?.settings.refresh("template.metrics");
  }

  public setRaceStatus(lap: number, lapTime: number, best: number | null, speed: number): void {
    this.ensureOverlay();
    if (this.lapEl) this.lapEl.innerHTML = `<strong>Lap ${lap + 1}</strong><span>${lapTime.toFixed(2)} s · Best ${best === null ? "—" : `${best.toFixed(2)} s`}</span>`;
    if (this.speedEl) this.speedEl.textContent = `${Math.round(Math.abs(speed) * 55)} km/h`;
  }

  public notify(message: string, durationMs = 2500): void {
    if (this.notifyTimer) clearTimeout(this.notifyTimer);
    const toast = this.ensureToast(); toast.innerHTML = `<strong>Top-Down Racing</strong><span>${escapeHtml(message)}</span>`; toast.hidden = false;
    this.notifyTimer = setTimeout(() => { toast.hidden = true; this.notifyTimer = null; }, durationMs);
  }

  public destroy(): void {
    if (this.notifyTimer) clearTimeout(this.notifyTimer);
    this.toastEl?.remove(); this.overlayEl?.remove(); this.styleEl?.remove();
    this.toastEl = null; this.overlayEl = null; this.lapEl = null; this.speedEl = null; this.styleEl = null;
    for (const d of this.disposers.splice(0).reverse()) void d.dispose();
    delete document.body.dataset.templateAdvanced; this.ui = null; this.source = null;
  }

  private ensureOverlay(): void {
    if (this.overlayEl) return;
    const overlay = document.createElement("div"); overlay.className = "template-race-overlay";
    overlay.innerHTML = '<div class="template-race-lap"></div><div class="template-race-speed">0 km/h</div>';
    document.body.appendChild(overlay); this.overlayEl = overlay;
    this.lapEl = overlay.querySelector(".template-race-lap"); this.speedEl = overlay.querySelector(".template-race-speed");
  }
  private ensureToast(): HTMLElement { if (this.toastEl) return this.toastEl; const el = document.createElement("div"); el.className = "template-toast"; el.hidden = true; document.body.appendChild(el); this.toastEl = el; return el; }
  private applyAdvanced(): void { document.body.dataset.templateAdvanced = this.advanced ? "1" : "0"; }
  private syncUrl(): void { const url = new URL(location.href); if (this.advanced) url.searchParams.set("advanced", "1"); else url.searchParams.delete("advanced"); history.replaceState({}, "", url); }
  private installUiStyle(ui: UiShellLike): void {
    ui.preferences.update({ layout: { sidePanelWidth: 340, sidePanelCollapsed: false, hiddenSlots: ["top-bar", "bottom-status"] } });
    this.styleEl = document.createElement("style"); this.styleEl.id = "template-ui-focus"; this.styleEl.textContent = `
      .forgeng-ui-surface[data-surface-id$=".chrome"],.forgeng-ui-surface[data-surface-id$=".menu"],.forgeng-ui-slot[data-slot="top-bar"]{display:none!important}
      .forgeng-ui-card[data-contribution-id="forgeng.renderer.webgpu.debug"],.forgeng-ui-card[data-contribution-id="forgeng.audio.webaudio.panel"],.forgeng-ui-card[data-contribution-id="forgeng.assets.health.panel"],body[data-template-advanced="0"] .forgeng-ui-card[data-contribution-id="template.metrics.panel"]{display:none!important}
      .forgeng-ui-shell{--fg-side-width:340px}.forgeng-ui-slot[data-slot="side-panel"]{top:12px;bottom:12px}
      @media(max-width:600px){.forgeng-ui-shell{--fg-side-width:min(260px,calc(100vw - 24px))}.forgeng-ui-slot[data-slot="side-panel"]{top:auto;bottom:12px;max-height:min(220px,26vh);overscroll-behavior:contain}}
    `; document.head.appendChild(this.styleEl);
  }
}

function escapeHtml(text: string): string { return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
