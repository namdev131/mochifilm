import { useSyncExternalStore } from "react";
import type { SourceId } from "./types";

export const STORAGE_KEY = "mochi-settings";
export const SOURCE_PRIORITY: SourceId[] = ["kkphim", "ophim", "aiphim", "vsmov"];

type Visibility = "public" | "friends" | "private";
export type MochiSettings = {
  defaultSource: "auto" | "kkphim" | "ophim" | "aiphim" | "vsmov";
  sourcePriority: SourceId[];
  sourceFallback: boolean;
  fastestSource: boolean;
  rememberMovieSource: boolean;
  quality: "auto" | "1080" | "720" | "480";
  autoplayNext: boolean;
  skipIntro: boolean;
  rememberProgress: boolean;
  playbackRate: 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;
  subtitleLanguage: "auto" | "vietsub" | "thuyet-minh" | "long-tieng";
  subtitleSize: "small" | "medium" | "large";
  subtitleBackground: number;
  performanceMode: "high" | "balanced" | "low" | "auto";
  autoOptimize: boolean;
  reduceMotion: boolean;
  reduceBlur: boolean;
  reduceGlow: boolean;
  backgroundVideo: boolean;
  lowQualityPosters: boolean;
  lazyImages: boolean;
  preload: "none" | "metadata" | "partial";
  theme: "dark" | "oled" | "system";
  density: "compact" | "normal" | "wide";
  mascotEffects: "full" | "reduced" | "off";
  effects: "full" | "reduced" | "off";
  notifications: { newEpisode: boolean; watchParty: boolean; favorites: boolean; comments: boolean; system: boolean };
  privacy: { watchHistory: boolean; activityVisibility: Visibility; favoritesVisibility: Visibility; showWatchParty: boolean };
};

export const defaultSettings: MochiSettings = {
  defaultSource: "auto", sourcePriority: SOURCE_PRIORITY, sourceFallback: true, fastestSource: true,
  rememberMovieSource: true, quality: "auto", autoplayNext: true, skipIntro: false,
  rememberProgress: true, playbackRate: 1, subtitleLanguage: "vietsub", subtitleSize: "medium",
  subtitleBackground: 60, performanceMode: "balanced", autoOptimize: true, reduceMotion: false,
  reduceBlur: false, reduceGlow: false, backgroundVideo: true, lowQualityPosters: false,
  lazyImages: true, preload: "metadata", theme: "dark", density: "normal", mascotEffects: "full",
  effects: "full", notifications: { newEpisode: true, watchParty: true, favorites: true, comments: true, system: true },
  privacy: { watchHistory: true, activityVisibility: "private", favoritesVisibility: "private", showWatchParty: true },
};

let current = defaultSettings;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function merge(raw: unknown): MochiSettings {
  if (!raw || typeof raw !== "object") return defaultSettings;
  const value = raw as Partial<MochiSettings>;
  return {
    ...defaultSettings, ...value,
    sourcePriority: Array.isArray(value.sourcePriority) ? value.sourcePriority.filter((id): id is SourceId => SOURCE_PRIORITY.includes(id as SourceId)) : SOURCE_PRIORITY,
    notifications: { ...defaultSettings.notifications, ...value.notifications },
    privacy: { ...defaultSettings.privacy, ...value.privacy },
  };
}

function effectivePerformance(settings: MochiSettings) {
  if (settings.performanceMode !== "auto" || !settings.autoOptimize || typeof navigator === "undefined") return settings.performanceMode;
  const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  return device.connection?.saveData || (device.deviceMemory ?? 8) <= 4 || (device.hardwareConcurrency ?? 8) <= 4 || ["slow-2g", "2g"].includes(device.connection?.effectiveType ?? "") ? "low" : "high";
}

export function applyMochiSettings(settings = current) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.performance = effectivePerformance(settings);
  root.dataset.motion = settings.reduceMotion ? "reduced" : "full";
  root.dataset.blur = settings.reduceBlur ? "reduced" : settings.effects;
  root.dataset.glow = settings.reduceGlow ? "reduced" : settings.effects;
  root.dataset.mascot = settings.mascotEffects;
  root.dataset.density = settings.density;
  root.style.setProperty("--mochi-subtitle-size", settings.subtitleSize === "small" ? "16px" : settings.subtitleSize === "large" ? "24px" : "20px");
  root.style.setProperty("--mochi-subtitle-bg", String(settings.subtitleBackground / 100));
}

export function initializeMochiSettings() {
  if (typeof localStorage !== "undefined") {
    try { current = merge(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); } catch { current = defaultSettings; }
  }
  applyMochiSettings();
  emit();
}

export const MochiSettingsStore = {
  get: () => current,
  set(patch: Partial<MochiSettings>) {
    current = merge({ ...current, ...patch });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    applyMochiSettings();
    emit();
  },
  reset() {
    current = defaultSettings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    applyMochiSettings();
    emit();
  },
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
};

export function useMochiSettings() {
  return useSyncExternalStore(MochiSettingsStore.subscribe, MochiSettingsStore.get, () => defaultSettings);
}

export function getSourceOrder(slug: string, requested?: SourceId) {
  const settings = MochiSettingsStore.get();
  const remembered = settings.rememberMovieSource && typeof localStorage !== "undefined" ? localStorage.getItem(`mochi-source:${slug}`) as SourceId | null : null;
  const preferred = requested || remembered || (settings.defaultSource === "auto" ? undefined : settings.defaultSource);
  return [preferred, ...settings.sourcePriority, ...SOURCE_PRIORITY].filter((id, index, all): id is SourceId => Boolean(id) && all.indexOf(id) === index);
}

export function rememberSuccessfulSource(slug: string, source: SourceId) {
  if (MochiSettingsStore.get().rememberMovieSource) localStorage.setItem(`mochi-source:${slug}`, source);
}
