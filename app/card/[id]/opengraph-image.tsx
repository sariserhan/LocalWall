import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPublicCard } from "@/server/public-card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const THEMES: Record<string, { bg: string; text: string; muted: string; accent: string }> = {
  yellow:    { bg: "#edcf35", text: "#1a1a18", muted: "#6a5200", accent: "#1a1a18" },
  paper:     { bg: "#edede8", text: "#1a1a18", muted: "#888880", accent: "#1a1a18" },
  pink:      { bg: "#e94782", text: "#ffffff", muted: "#ffc8d8", accent: "#fff" },
  cyan:      { bg: "#29b8ce", text: "#062830", muted: "#0a5870", accent: "#062830" },
  dark:      { bg: "#181818", text: "#f3eee2", muted: "#666",    accent: "#edcf35" },
  cream:     { bg: "#e8e4da", text: "#1a1a18", muted: "#888880", accent: "#1a1a18" },
  biz:       { bg: "#ffffff", text: "#111111", muted: "#888888", accent: "#111111" },
  kraft:     { bg: "#c8a97a", text: "#2a1a06", muted: "#5c3a10", accent: "#2a1a06" },
  blueprint: { bg: "#0d2340", text: "#e8f4ff", muted: "#5b9ed4", accent: "#7ab8f0" },
  photo:     { bg: "#f8f6f0", text: "#161616", muted: "#888888", accent: "#161616" },
  ticket:    { bg: "#ff6b35", text: "#16120d", muted: "#7a3010", accent: "#16120d" },
};

async function loadFont(relativePath: string): Promise<ArrayBuffer> {
  const abs = path.join(process.cwd(), relativePath);
  const buf = await readFile(abs);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [card, barlowData, interData] = await Promise.all([
    getPublicCard(id),
    loadFont("node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-900-normal.woff2").catch(() => null),
    loadFont("node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2").catch(() => null),
  ]);

  type W = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  const fonts: { name: string; data: ArrayBuffer; weight: W; style: "normal" | "italic" }[] = [];
  if (barlowData) fonts.push({ name: "BarlowC", data: barlowData, weight: 900, style: "normal" });
  if (interData)  fonts.push({ name: "Inter",   data: interData,  weight: 700, style: "normal" });

  if (!card) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#1a1a18", color: "#f3eee2", fontFamily: "Inter, sans-serif", fontSize: 32 }}>
        LocalWall
      </div>,
      { ...size, fonts },
    );
  }

  const t = THEMES[card.theme] ?? THEMES.paper;
  const location = [card.city, card.state].filter(Boolean).join(", ");
  const label = [card.category, location].filter(Boolean).join("  ·  ");
  const description = (card.message || card.line || "").slice(0, 110);
  const cardImage = card.images?.[0] ?? null;
  const nameSize = card.name.length > 22 ? (card.name.length > 32 ? 64 : 76) : 92;
  const contentWidth = cardImage ? "60%" : "100%";

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: t.bg, position: "relative", overflow: "hidden" }}>

      {/* Text column */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: contentWidth, height: "100%", padding: "52px 64px 48px" }}>

        {/* Brand */}
        <div style={{ display: "flex", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: t.muted, textTransform: "uppercase" }}>
          LOCALWALL
        </div>

        {/* Card content */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {label ? (
            <div style={{ display: "flex", fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase", marginBottom: 20 }}>
              {label}
            </div>
          ) : null}

          <div style={{ display: "flex", fontFamily: "BarlowC, sans-serif", fontSize: nameSize, fontWeight: 900, color: t.text, lineHeight: 0.88, textTransform: "uppercase", marginBottom: description ? 24 : 0 }}>
            {card.name}
          </div>

          {description ? (
            <div style={{ display: "flex", fontFamily: "Inter, sans-serif", fontSize: 22, fontWeight: 400, color: t.text, opacity: 0.65, lineHeight: 1.35 }}>
              {description}
            </div>
          ) : null}

          {card.price ? (
            <div style={{ display: "flex", fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, color: t.accent, marginTop: 18, opacity: 0.85 }}>
              {card.price}
            </div>
          ) : null}
        </div>

        {/* Domain */}
        <div style={{ display: "flex", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: t.muted, textTransform: "lowercase" }}>
          localwall.co
        </div>
      </div>

      {/* Card image */}
      {cardImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cardImage}
          alt=""
          style={{ position: "absolute", right: 0, top: 0, width: "42%", height: "100%", objectFit: "cover" }}
        />
      ) : null}

      {/* Gradient fade over image edge */}
      {cardImage ? (
        <div style={{
          display: "flex",
          position: "absolute",
          right: "38%",
          top: 0,
          width: 120,
          height: "100%",
          background: `linear-gradient(to right, ${t.bg}, transparent)`,
        }} />
      ) : null}

    </div>,
    { ...size, fonts },
  );
}
