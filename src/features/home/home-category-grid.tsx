"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Baby, BarChart2, Briefcase, Building2, Car, ClipboardList,
  GraduationCap, Hammer, Heart, HeartHandshake, Home, Laptop,
  PartyPopper, PawPrint, Scissors, ShoppingBag, Tag, Truck,
  Users, UtensilsCrossed, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toCategorySlug } from "@/lib/wall-slug";

const ICONS: Record<string, LucideIcon> = {
  "Services": Wrench,
  "Repairs": Hammer,
  "Jobs": ClipboardList,
  "Real Estate": Building2,
  "Buy & Sell Marketplace": Tag,
  "Food & Catering": UtensilsCrossed,
  "Health & Fitness": Heart,
  "Shops & Retail": ShoppingBag,
  "Home & Garden": Home,
  "Events & Entertainment": PartyPopper,
  "Pets": PawPrint,
  "Classes & Education": GraduationCap,
  "Automotive": Car,
  "Beauty & Personal Care": Scissors,
  "Professional Services": Briefcase,
  "Technology": Laptop,
  "Child & Family": Baby,
  "Community": Users,
  "Dating": HeartHandshake,
  "Vehicles": Truck,
};

interface Props {
  topCategories: string[];
  allCategories: string[];
}

export function HomeCategoryGrid({ topCategories, allCategories }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? allCategories : topCategories;

  return (
    <>
      <div className="home-category-grid">
        {visible.map((cat) => {
          const Icon = ICONS[cat];
          return (
            <Link key={cat} href={`/us/${toCategorySlug(cat)}`} className="home-category-item">
              {Icon ? <Icon size={22} /> : null}
              <span>{cat}</span>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        className="home-category-toggle"
        onClick={() => setShowAll((v) => !v)}
      >
        {showAll ? "Show less ↑" : `See all ${allCategories.length} categories ↓`}
      </button>
    </>
  );
}
