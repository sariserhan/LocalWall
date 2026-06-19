export const categories = ["All", "Services", "Food", "Home", "Classes", "Pets", "Repairs", "Shops"] as const;
export const cardThemes = ["yellow", "paper", "pink", "cyan", "dark", "cream"] as const;

export type CardCategory = Exclude<(typeof categories)[number], "All">;
export type CardTheme = (typeof cardThemes)[number];

export interface WallCard {
  id: string;
  name: string;
  category: CardCategory;
  line: string;
  area: string;
  price?: string;
  theme: CardTheme;
  images: string[];
  x: number;
  y: number;
  rotation: number;
  width: number;
  zIndex: number;
  positionLockedAt?: number;
  createdAt: number;
  ownerId?: string;
}

export interface CardDraft {
  name: string;
  category: CardCategory;
  line: string;
  area: string;
  price?: string;
  theme: CardTheme;
  files: File[];
  previews: string[];
}

export interface Placement {
  x: number;
  y: number;
}

export type CreateCard = (draft: CardDraft, placement: Placement) => Promise<WallCard | void>;
