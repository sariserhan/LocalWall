"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import type { WallCard as WallCardModel } from "./types";

interface WallCardProps {
  card: WallCardModel;
  active: boolean;
  onOpen: (card: WallCardModel) => void;
  onFront: (id: string) => void;
  zIndex: number;
}

type CardStyle = CSSProperties & Record<"--x" | "--y" | "--r" | "--w", string>;

export function WallCard({ card, active, onOpen, onFront, zIndex }: WallCardProps) {
  const style: CardStyle = {
    "--x": `${card.x}%`,
    "--y": `${card.y}px`,
    "--r": `${card.rotation}deg`,
    "--w": `${card.width}px`,
    zIndex,
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(card);
    }
  };

  return (
    <article
      className={`wall-card theme-${card.theme} ${active ? "is-active" : ""}`}
      style={style}
      onPointerDown={() => onFront(card.id)}
      onClick={() => onOpen(card)}
      tabIndex={0}
      role="button"
      onKeyDown={handleKeyDown}
      aria-label={`Open advertisement for ${card.name}`}
    >
      <span className="card-tape" aria-hidden="true" />
      <div className="card-copy">
        <p className="card-category">{card.category}</p>
        <h2>{card.name}</h2>
        <p className="card-line">{card.line}</p>
      </div>
      {card.images[0] ? <img src={card.images[0]} alt="" draggable="false" /> : null}
      <footer>
        <span>{card.area}</span>
        {card.price ? <strong>{card.price}</strong> : null}
      </footer>
    </article>
  );
}
