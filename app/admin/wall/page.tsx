import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "next/navigation";
import { fetchInitialCards } from "@/lib/server-cards";
import { WallPageShell } from "@/features/wall/wall-page-shell";
import { api } from "../../../convex/_generated/api";

export const metadata: Metadata = { title: "Admin Playground Wall", robots: { index: false, follow: false } };

const PG_LOCATION = { country: "xx", state: "test", city: "Playground" };

export default async function AdminWallPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/");

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) redirect("/");

  const token = await getToken({ template: "convex" });
  if (!token) redirect("/");

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(token);

  const access: { isAdmin: boolean } = await convex.query(api.admin.getAccess, {});
  if (!access.isAdmin) redirect("/");

  const initialCards = await fetchInitialCards(PG_LOCATION);
  return (
    <WallPageShell
      initialLocation={PG_LOCATION}
      initialCards={initialCards}
    />
  );
}
