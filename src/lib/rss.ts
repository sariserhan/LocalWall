import type { WallCard } from "@/features/wall/types";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://localwall.co").replace(/\/$/, "");

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(ts: number): string {
  return new Date(ts).toUTCString();
}

export function buildRssFeed({
  title,
  description,
  wallPath,
  cards,
}: {
  title: string;
  description: string;
  wallPath: string;
  cards: WallCard[];
}): string {
  const wallUrl = `${APP_URL}${wallPath}`;
  const feedUrl = `${wallUrl}/feed.xml`;
  const now = rfc822(Date.now());

  const items = cards
    .slice(0, 25)
    .map((card) => {
      const cardUrl = `${APP_URL}/card/${String(card.id)}`;
      const loc = [card.city, card.state].filter(Boolean).join(", ");
      const descParts = [card.line, card.message].filter(Boolean).join(" — ");
      const fullDesc = [descParts, loc ? `📍 ${loc}` : null, card.price ? `💰 ${card.price}` : null]
        .filter(Boolean)
        .join("  ·  ");

      return `
    <item>
      <title>${escapeXml(card.name)}</title>
      <link>${cardUrl}</link>
      <guid isPermaLink="true">${cardUrl}</guid>
      <pubDate>${rfc822(card.createdAt)}</pubDate>
      <category>${escapeXml(card.category)}</category>
      <description><![CDATA[${fullDesc}]]></description>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${wallUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${APP_URL}/assets/logo-big.png</url>
      <title>${escapeXml(title)}</title>
      <link>${wallUrl}</link>
    </image>${items}
  </channel>
</rss>`;
}

export function rssFeedResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
