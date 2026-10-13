"use client";

import { useEffect } from "react";

/**
 * Add a styling hook only when the site is installed/launched as a PWA.
 * Normal browser tabs intentionally keep the existing website appearance.
 */
export default function PWAAppMode() {
  useEffect(() => {
    const isStandalone = () => {
      const displayMode = window.matchMedia?.("(display-mode: standalone)")?.matches;
      const iosStandalone = window.navigator.standalone === true;
      return Boolean(displayMode || iosStandalone);
    };

    const applyMode = () => {
      const active = isStandalone();
      document.documentElement.classList.toggle("pwa-standalone", active);
      document.body.classList.toggle("pwa-standalone", active);
      document.documentElement.dataset.pwaMode = active ? "standalone" : "browser";
    };

    applyMode();
    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", applyMode);
    window.addEventListener("pageshow", applyMode);
    window.addEventListener("appinstalled", applyMode);
    return () => {
      media?.removeEventListener?.("change", applyMode);
      window.removeEventListener("pageshow", applyMode);
      window.removeEventListener("appinstalled", applyMode);
      document.documentElement.classList.remove("pwa-standalone");
      document.body.classList.remove("pwa-standalone");
      delete document.documentElement.dataset.pwaMode;
    };
  }, []);

  return null;
}
