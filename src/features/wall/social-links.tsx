"use client";

import type { ComponentType, MouseEvent, PointerEvent, SVGProps } from "react";
import { MapPin } from "lucide-react";
import type { WallCard } from "./types";

type SocialKey = "instagram" | "facebook" | "tiktok" | "linkedin" | "whatsapp" | "telegram";

const InstagramIcon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
const FacebookIcon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M13.7 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5H17V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.5V13h2.8v8h3.4Z" /></svg>;
const TikTokIcon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 4c.5 2.7 2 4.2 4.5 4.6" /><path d="M15 4v11.2a4.2 4.2 0 1 1-3.5-4.1" /></svg>;
const LinkedinIcon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M5.2 8.3H2.3V21h2.9V8.3ZM3.7 3A1.8 1.8 0 1 0 3.7 6.6 1.8 1.8 0 0 0 3.7 3ZM21.7 13.7c0-3.8-2-5.6-4.7-5.6-2.2 0-3.1 1.2-3.7 2V8.3h-2.9V21h2.9v-7c0-1.8.4-3.6 2.7-3.6 2.3 0 2.3 2.1 2.3 3.7V21h3.4v-7.3Z" /></svg>;
const WhatsAppIcon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.528 3.654 1.443 5.154L2 22l4.977-1.415A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm5.077 13.923c-.21.588-1.234 1.12-1.692 1.176-.457.055-.462.363-2.914-.61-2.95-1.163-4.796-4.166-4.94-4.36-.144-.194-1.165-1.551-1.165-2.96 0-1.41.738-2.107 1.006-2.4.268-.292.582-.366.777-.366.195 0 .389.002.559.01.18.008.42-.068.657.501.24.574.81 1.978.881 2.121.07.143.116.31.023.499-.093.19-.14.307-.278.472-.137.165-.29.37-.413.497-.137.14-.28.292-.12.573.16.28.71 1.17 1.524 1.895 1.046.932 1.928 1.22 2.208 1.36.28.14.443.116.607-.07.164-.186.7-.815.887-1.094.188-.28.375-.233.633-.14.258.093 1.64.773 1.92.914.28.14.467.21.535.326.07.117.07.675-.14 1.263Z" /></svg>;
const TelegramIcon = (props: SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm4.64 6.8-1.7 8.02c-.12.57-.46.7-.92.44l-2.55-1.88-1.23 1.19c-.14.14-.25.25-.51.25l.18-2.6 4.74-4.28c.2-.18-.05-.28-.32-.1L7.67 14.4 5.14 13.6c-.55-.17-.57-.55.12-.82l8.9-3.43c.46-.17.86.11.48.45Z" /></svg>;

const socialConfig: Array<{ key: SocialKey; label: string; getHref: (value: string) => string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = [
  {
    key: "instagram",
    label: "Instagram",
    getHref: (v) => /^https?:\/\//i.test(v) ? v : /^(www\.)?[a-z0-9-]+\.[a-z]{2,}/i.test(v) ? `https://${v}` : `https://instagram.com/${v.replace(/^@/, "")}`,
    Icon: InstagramIcon,
  },
  {
    key: "facebook",
    label: "Facebook",
    getHref: (v) => /^https?:\/\//i.test(v) ? v : /^(www\.)?[a-z0-9-]+\.[a-z]{2,}/i.test(v) ? `https://${v}` : `https://facebook.com/${v.replace(/^@/, "")}`,
    Icon: FacebookIcon,
  },
  {
    key: "tiktok",
    label: "TikTok",
    getHref: (v) => /^https?:\/\//i.test(v) ? v : /^(www\.)?[a-z0-9-]+\.[a-z]{2,}/i.test(v) ? `https://${v}` : `https://tiktok.com/@${v.replace(/^@/, "")}`,
    Icon: TikTokIcon,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    getHref: (v) => /^https?:\/\//i.test(v) ? v : /^(www\.)?[a-z0-9-]+\.[a-z]{2,}/i.test(v) ? `https://${v}` : `https://linkedin.com/in/${v.replace(/^@/, "")}`,
    Icon: LinkedinIcon,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    getHref: (v) => {
      const digits = v.replace(/[^0-9+]/g, "");
      return `https://wa.me/${digits.replace(/^\+/, "")}`;
    },
    Icon: WhatsAppIcon,
  },
  {
    key: "telegram",
    label: "Telegram",
    getHref: (v) => {
      if (/^https?:\/\//i.test(v)) return v;
      const handle = v.replace(/^@/, "").replace(/^(t\.me\/|telegram\.me\/)/, "");
      return `https://t.me/${handle}`;
    },
    Icon: TelegramIcon,
  },
];

type SocialCard = Pick<WallCard, "name" | "location" | "instagram" | "facebook" | "tiktok" | "linkedin" | "whatsapp" | "telegram">;

function mapsHref(location: string) {
  const trimmed = location.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

export function SocialLinks({ card, onVisit }: { card: SocialCard; onVisit?: () => void }) {
  const profiles = socialConfig.flatMap(({ key, ...config }) => card[key] ? [{ ...config, key, value: card[key] as string }] : []);
  if (profiles.length === 0 && !card.location) return null;

  const stopPointer = (event: PointerEvent<HTMLAnchorElement>) => event.stopPropagation();
  const stopClick = (event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation();

  return (
    <div className="detail-socials" aria-label={`${card.name} social media`}>
      {profiles.map(({ key, label, getHref, Icon, value }) => (
        <a
          key={key}
          href={getHref(value.trim())}
          target="_blank"
          rel="noreferrer"
          aria-label={`${card.name} on ${label}`}
          title={label}
          onPointerDown={stopPointer}
          onClick={(event) => { stopClick(event); onVisit?.(); }}
        >
          <Icon aria-hidden="true" />
        </a>
      ))}
      {card.location ? (
        <a href={mapsHref(card.location)} target="_blank" rel="noreferrer" aria-label={`View ${card.name} location in Google Maps`} title="Google Maps" onPointerDown={stopPointer} onClick={(event) => { stopClick(event); onVisit?.(); }}>
          <MapPin aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
