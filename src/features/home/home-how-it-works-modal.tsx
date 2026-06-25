"use client";

import { useEffect, useState } from "react";
import { MapPin, PenLine, Share2, Zap } from "lucide-react";

const STEPS = [
  {
    num: 1,
    Icon: MapPin,
    title: "Choose your city",
    desc: "Browse your local wall or search for any city or neighborhood.",
  },
  {
    num: 2,
    Icon: PenLine,
    title: "Create your ad",
    desc: "Fill in your details, pick a card style, and choose how long your listing stays live.",
  },
  {
    num: 3,
    Icon: Share2,
    title: "Share your listing",
    desc: "Every card gets its own link — share on social, WhatsApp, or anywhere in seconds.",
  },
  {
    num: 4,
    Icon: Zap,
    title: "Get discovered locally",
    desc: "People in your city find your ad on the wall and reach out directly to you.",
  },
];

export function HomeHowItWorksModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="home-footer-how-btn" onClick={() => setOpen(true)}>
        How it works
      </button>

      {open && (
        <div className="hiw-backdrop" onClick={() => setOpen(false)}>
          <div className="hiw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hiw-header">
              <h2 className="hiw-title">How LocalWall works</h2>
              <button type="button" className="hiw-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="hiw-steps">
              {STEPS.map(({ num, Icon, title, desc }) => (
                <div key={num} className="hiw-step">
                  <div className="hiw-step-header">
                    <div className="hiw-step-icon"><Icon size={22} /></div>
                    <strong className="hiw-step-title">{title}</strong>
                  </div>
                  <p className="hiw-step-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
