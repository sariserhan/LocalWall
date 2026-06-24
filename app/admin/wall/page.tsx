import type { Metadata } from "next";
import { fetchInitialCards } from "@/lib/server-cards";
import { WallPageShell } from "@/features/wall/wall-page-shell";

export const metadata: Metadata = { title: "Admin Playground Wall", robots: { index: false, follow: false } };

const PG_LOCATION = { country: "xx", state: "test", city: "Playground" };

export default async function AdminWallPage() {
  const initialCards = await fetchInitialCards(PG_LOCATION);
  return (
    <WallPageShell
      initialLocation={PG_LOCATION}
      initialCards={initialCards}
    />
  );
}
