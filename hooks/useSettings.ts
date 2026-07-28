"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/sessionStore";

// Settings live in localStorage (client-only). Start from defaults so SSR and
// the first client render agree, then hydrate the stored values after mount.
// `update` persists immediately — the Settings screen has no explicit save.
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update(patch: Partial<AppSettings>) {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  }

  return { settings, update };
}
