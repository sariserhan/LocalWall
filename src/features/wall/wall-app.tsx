"use client";

import {
  ChevronDown,
  Layers3,
  MapPin,
  Menu,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Composer } from "./composer";
import { DetailPanel } from "./detail-panel";
import { PlacementMode } from "./placement-mode";
import { seedCards } from "./seed-cards";
import { WallCard } from "./wall-card";
import { categories, type CardDraft, type CreateCard, type Placement, type WallCard as WallCardModel } from "./types";

interface WallAppProps {
  mode: "demo" | "connected";
  cards?: WallCardModel[];
  onCreateCard?: CreateCard;
  onRequestSignIn?: () => void;
  isSignedIn?: boolean;
  isLoading?: boolean;
  authControl?: ReactNode;
}

function makeDemoCard(draft: CardDraft, placement: Placement, zIndex: number): WallCardModel {
  return {
    id: `demo-${Date.now()}`,
    name: draft.name,
    category: draft.category,
    line: draft.line,
    area: draft.area,
    price: draft.price,
    theme: draft.theme,
    images: draft.previews,
    x: placement.x,
    y: placement.y,
    rotation: -3 + Math.random() * 6,
    width: 220,
    zIndex,
    positionLockedAt: Date.now(),
    createdAt: Date.now(),
  };
}

export function WallApp({ mode, cards: remoteCards, onCreateCard, onRequestSignIn, isSignedIn = mode === "demo", isLoading = false, authControl }: WallAppProps) {
  const [demoCards, setDemoCards] = useState<WallCardModel[]>(seedCards);
  const cards = mode === "connected" ? (remoteCards ?? []) : demoCards;
  const [selected, setSelected] = useState<WallCardModel | null>(null);
  const [composer, setComposer] = useState(false);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [fresh, setFresh] = useState(false);
  const [layers, setLayers] = useState<string[]>(seedCards.map((card) => card.id));
  const [mobileMenu, setMobileMenu] = useState(false);
  const [pendingCard, setPendingCard] = useState<CardDraft | null>(null);
  const [placement, setPlacement] = useState<Placement>({ x: 40, y: 170 });
  const [dragging, setDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallRef = useRef<HTMLElement>(null);

  const visible = useMemo(() => {
    const needle = deferredQuery.toLowerCase();
    const result = cards.filter((card) => (category === "All" || card.category === category) && `${card.name} ${card.line} ${card.area}`.toLowerCase().includes(needle));
    return fresh ? result.toReversed() : result;
  }, [cards, category, deferredQuery, fresh]);

  const front = (id: string) => setLayers((current) => [...current.filter((item) => item !== id), id]);

  const openComposer = () => {
    setError(null);
    if (!isSignedIn) {
      onRequestSignIn?.();
      return;
    }
    setComposer(true);
  };

  const beginPlacement = (draft: CardDraft) => {
    setComposer(false);
    setSelected(null);
    setPendingCard(draft);
    setPlacement({ x: window.innerWidth < 780 ? 23 : 40, y: Math.max(90, window.scrollY + 120) });
  };

  const movePlacement = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !wallRef.current) return;
    const rect = wallRef.current.getBoundingClientRect();
    const cardWidth = window.innerWidth < 780 ? 182 : 220;
    const maxLeft = Math.max(12, rect.width - cardWidth - 12);
    const left = Math.min(maxLeft, Math.max(12, event.clientX - rect.left - cardWidth / 2));
    const top = Math.min(rect.height - 250, Math.max(28, event.clientY - rect.top - 90));
    setPlacement({ x: (left / rect.width) * 100, y: top });
  };

  const post = async () => {
    if (!pendingCard) return;
    setIsSaving(true);
    setError(null);
    try {
      let card: WallCardModel | void;
      if (mode === "demo") {
        card = makeDemoCard(pendingCard, placement, cards.length + 1);
        setDemoCards((current) => [...current, card as WallCardModel]);
      } else {
        card = await onCreateCard?.(pendingCard, placement);
      }
      setPendingCard(null);
      if (card) {
        setLayers((current) => [...current, card.id]);
        setSelected(card);
      }
      setFresh(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The card could not be posted.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    startTransition(() => {
      setCategory("All");
      setQuery("");
      setFresh(false);
    });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={resetFilters}>WALL<span>LOCAL ADS, STUCK HERE</span></button>
        <button className="location"><MapPin /> Williamsburg, Brooklyn <ChevronDown /></button>
        <nav className={mobileMenu ? "open" : ""}>
          <div className="search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the wall" aria-label="Search advertisements" /></div>
          <label className="filter-select">Browse<select value={category} onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown /></label>
          <button className={fresh ? "nav-active" : ""} onClick={() => setFresh((value) => !value)}>Fresh <span className="fresh-dot" /></button>
          <button className="mobile-nav-post" onClick={openComposer}><Plus /> Post your card</button>
        </nav>
        {authControl ? <div className="auth-control">{authControl}</div> : null}
        <button className="primary post-button" onClick={openComposer}><Plus /> Post your card</button>
        <button className="icon-btn mobile-menu" onClick={() => setMobileMenu((value) => !value)} aria-label="Open menu"><Menu /></button>
      </header>
      <section className={`wall ${pendingCard ? "is-placing" : ""}`} ref={wallRef} aria-label="Community advertisement wall">
        <div className="wall-grain" />
        {isLoading ? <div className="empty-note"><strong>Finding the fresh paste…</strong></div> : null}
        {!isLoading ? visible.map((card) => <WallCard key={card.id} card={card} active={selected?.id === card.id} onOpen={setSelected} onFront={front} zIndex={Math.max(card.zIndex, layers.indexOf(card.id) + 1)} />) : null}
        {!isLoading && !visible.length ? <div className="empty-note"><strong>Nothing stuck here yet.</strong><span>Try another corner of the wall.</span><button onClick={resetFilters}>Reset filters</button></div> : null}
        <div className="wall-tools">
          <button aria-label="Show newest cards" onClick={() => setFresh(true)}><Layers3 /></button>
          <button aria-label="Reset wall" onClick={resetFilters}><RotateCcw /></button>
        </div>
        <div className="wall-count">{visible.length} CARDS · WILLIAMSBURG</div>
        {pendingCard ? <PlacementMode card={pendingCard} position={placement} dragging={dragging} onDragStart={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }} onMove={movePlacement} onDragEnd={() => setDragging(false)} onCancel={() => { setPendingCard(null); setDragging(false); }} onRandom={() => setPlacement({ x: 8 + Math.random() * (window.innerWidth < 780 ? 35 : 68), y: Math.max(60, window.scrollY + 60 + Math.random() * 450) })} onConfirm={post} isSaving={isSaving} /> : null}
      </section>
      {error ? <div className="error-toast" role="alert">{error}<button onClick={() => setError(null)} aria-label="Dismiss error">×</button></div> : null}
      {selected ? <DetailPanel card={selected} onClose={() => setSelected(null)} /> : null}
      {composer ? <Composer onClose={() => setComposer(false)} onReady={beginPlacement} /> : null}
    </main>
  );
}
