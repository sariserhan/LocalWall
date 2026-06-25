"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

export function ClerkThemePortal() {
  const { isDark, toggleTheme } = useTheme();
  const [anchor, setAnchor] = useState<Element | null>(null);

  useEffect(() => {
    const sync = () => {
      const el = document.querySelector('[class*="userButtonPopoverMain"]');
      setAnchor((prev) => (prev === el ? prev : el ?? null));
    };
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });
    sync();
    return () => mo.disconnect();
  }, []);

  if (!anchor) return null;

  return createPortal(
    <button
      type="button"
      className="clerk-theme-btn"
      onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>,
    anchor,
  );
}
