"use client";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wall-color-scheme";

type Resolved = "light" | "dark";

function getSystemResolved(): Resolved {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(resolved: Resolved) {
  document.documentElement.dataset.theme = resolved;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Resolved | null;
    const resolved = (saved === "dark" || saved === "light") ? saved : getSystemResolved();
    setIsDark(resolved === "dark");
    apply(resolved);

    if (!saved) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          const r = getSystemResolved();
          setIsDark(r === "dark");
          apply(r);
        }
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next: Resolved = prev ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
      return !prev;
    });
  }, []);

  return { isDark, toggleTheme };
}
