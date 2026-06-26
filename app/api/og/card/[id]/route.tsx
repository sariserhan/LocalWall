import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const runtime = "nodejs";

const W = 1200;
const H = 630;

async function fonts() {
  const [barlow, inter] = await Promise.all([
    readFile(path.join(process.cwd(), "node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff")),
    readFile(path.join(process.cwd(), "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff")),
  ]);
  return [
    { name: "Barlow Condensed", data: barlow.buffer.slice(barlow.byteOffset, barlow.byteOffset + barlow.byteLength) as ArrayBuffer, weight: 800 as const, style: "normal" as const },
    { name: "Inter", data: inter.buffer.slice(inter.byteOffset, inter.byteOffset + inter.byteLength) as ArrayBuffer, weight: 400 as const, style: "normal" as const },
  ];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  let card: { name: string; category: string; line: string; city?: string; state?: string; thumbnailImages?: string[]; images: string[] } | null = null;
  if (convexUrl) {
    const client = new ConvexHttpClient(convexUrl);
    try {
      card = await client.query(api.cards.getPublishedById, { cardId: id as Id<"cards"> });
    } catch {
      card = null;
    }
  }

  const name = card?.name ?? "LocalWall";
  const category = (card?.category ?? "") as string;
  const line = card?.line ?? "";
  const location = [card?.city, card?.state].filter(Boolean).join(", ");
  const thumbnail = card?.thumbnailImages?.[0] ?? card?.images?.[0] ?? null;
  const hasImage = !!thumbnail;
  const textWidth = hasImage ? 560 : 800;
  const nameFontSize = hasImage ? 68 : 88;
  const padding = hasImage ? "52px 52px 44px" : "68px 80px 52px";

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          background: "#eeece7",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        {/* Left image panel */}
        {hasImage && (
          <div style={{ width: 460, height: H, display: "flex", flexShrink: 0, overflow: "hidden" }}>
            <img src={thumbnail} width={460} height={H} style={{ objectFit: "cover" }} alt="" />
            {/* subtle right-edge fade */}
            <div
              style={{
                position: "absolute",
                left: 380,
                top: 0,
                width: 80,
                height: H,
                background: "linear-gradient(to right, transparent, #eeece7)",
              }}
            />
          </div>
        )}

        {/* Text panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Category badge */}
            {category ? (
              <div style={{ display: "flex", marginBottom: 22 }}>
                <span
                  style={{
                    background: "#f43d38",
                    color: "#fff",
                    fontFamily: "Barlow Condensed",
                    fontSize: 17,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    padding: "5px 13px",
                  }}
                >
                  {category}
                </span>
              </div>
            ) : null}

            {/* Card name */}
            <div
              style={{
                fontFamily: "Barlow Condensed",
                fontSize: nameFontSize,
                fontWeight: 800,
                color: "#141414",
                lineHeight: 0.9,
                textTransform: "uppercase",
                marginBottom: 18,
                maxWidth: textWidth,
              }}
            >
              {name.length > 40 ? name.slice(0, 40) + "…" : name}
            </div>

            {/* Tagline */}
            {line ? (
              <div
                style={{
                  fontSize: 21,
                  color: "#555",
                  lineHeight: 1.45,
                  maxWidth: textWidth,
                }}
              >
                {line.length > 110 ? line.slice(0, 110) + "…" : line}
              </div>
            ) : null}

            {/* Location */}
            {location ? (
              <div
                style={{
                  fontSize: 17,
                  color: "#888",
                  marginTop: 18,
                }}
              >
                {location}
              </div>
            ) : null}
          </div>

          {/* Footer branding */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              borderTop: "1px solid #c4c1bb",
              paddingTop: 18,
            }}
          >
            <span
              style={{
                fontFamily: "Barlow Condensed",
                fontSize: 26,
                fontWeight: 800,
                color: "#141414",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              LocalWall
            </span>
            <span style={{ fontSize: 15, color: "#999" }}>your local bulletin board</span>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: await fonts(),
      headers: { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    },
  );
}
