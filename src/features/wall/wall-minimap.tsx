"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { cardFormats } from "./types";
import type { WallCard } from "./types";

const MAP_W = 80;
const MAP_MAX_H = 560;

const THEME_DOT: Record<string, string> = {
  yellow:    "#c89018",
  paper:     "#9c9890",
  pink:      "#c07888",
  cyan:      "#389098",
  dark:      "#505060",
  cream:     "#b0a878",
  biz:       "#243448",
  kraft:     "#7a6040",
  blueprint: "#183468",
  photo:     "#384048",
};

interface Dims {
  scrollY: number;
  innerHeight: number;
  wallH: number;
  wallTop: number;
  wallW: number;
}

interface Props {
  cards: WallCard[];
  wallRef: RefObject<HTMLElement | null>;
}

export function WallMinimap({ cards, wallRef }: Props) {
  const [dims, setDims] = useState<Dims | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const el = wallRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setDims({
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
        wallH: el.scrollHeight,
        wallTop: rect.top + window.scrollY,
        wallW: rect.width || window.innerWidth,
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [wallRef]);

  if (!dims || dims.wallH === 0 || cards.length === 0) return null;
  if (dims.wallH <= dims.innerHeight * 1.2) return null;

  const scale = Math.min(MAP_MAX_H / dims.wallH, 1);
  const mapH = Math.round(dims.wallH * scale);

  const vpRelTop = dims.scrollY - dims.wallTop;
  const vpTop = Math.max(0, Math.round(vpRelTop * scale));
  const vpH = Math.max(4, Math.min(Math.round(dims.innerHeight * scale), mapH - vpTop));

  const scrollToRatio = (clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const relY = clientY - rect.top;
    const wallY = relY / scale;
    window.scrollTo({ top: dims.wallTop + wallY - dims.innerHeight / 2, behavior: "smooth" });
  };

  return (
    <div
      className="wall-minimap"
      style={{ height: mapH }}
      onPointerDown={(e) => {
        isDragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        scrollToRatio(e.clientY, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return;
        scrollToRatio(e.clientY, e.currentTarget);
      }}
      onPointerUp={() => { isDragging.current = false; }}
    >
      {cards.map((card) => {
        const fmt = cardFormats[card.theme];
        const dotW = Math.max(3, Math.round((fmt.width / dims.wallW) * MAP_W));
        const dotH = Math.max(3, Math.min(8, Math.round(fmt.minHeight * scale)));
        const dotX = Math.round((card.x / 100) * MAP_W);
        const dotY = Math.round(card.y * scale);
        return (
          <div
            key={String(card.id)}
            className="wall-minimap-card"
            style={{
              left: dotX,
              top: dotY,
              width: dotW,
              height: dotH,
              background: THEME_DOT[card.theme] ?? "#888",
            }}
          />
        );
      })}
      <div className="wall-minimap-vp" style={{ top: vpTop, height: vpH }} />
    </div>
  );
}
