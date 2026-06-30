"use client";

import { useMutation, useQuery } from "convex/react";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { openAdminPanel } from "@/lib/admin-signal";
import { openDashboard } from "@/lib/dashboard-signal";
import { useTheme } from "@/lib/use-theme";
import { ClerkAvatarMenu } from "@/components/clerk-avatar-menu";
import { HomePostButton } from "./home-post-button";

export function HomeNav({ isSignedIn = false, showAvatarButton = false }: { isSignedIn?: boolean; showAvatarButton?: boolean } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const isTrending = pathname === "/trending";
  const { isDark } = useTheme();
  const profile = useQuery(api.cards.getMyProfile, isSignedIn ? {} : "skip") as { displayName: string | null; username: string | null; businessName: string | null; verified: boolean } | null | undefined;
  const updateProfileMutation = useMutation(api.cards.updateProfile);
  const adminAccess = useQuery(api.admin.getAccess, isSignedIn ? {} : "skip") as { isAdmin: boolean } | undefined;

  return (
    <header className={`home-nav${isTrending ? " home-nav--trending" : ""}`}>
      <Link href="/" className="home-nav-brand">
        <strong>LocalWall</strong>
        <small>your local bulletin board</small>
      </Link>
      <nav className="home-nav-right">
        {!isTrending && (
          <Link href="/trending" className="home-nav-trending">
            <TrendingUp size={12} />
            Trending
          </Link>
        )}
        <HomePostButton />
        {isSignedIn && showAvatarButton ? (
          <ClerkAvatarMenu
            isDark={isDark}
            profile={profile}
            isReady={profile !== undefined}
            onUpdateBusinessName={async (businessName) => { await updateProfileMutation({ businessName }); }}
            onOpenAdminPanel={adminAccess?.isAdmin ? () => openAdminPanel() : undefined}
            onOpenDashboard={() => openDashboard()}
            onOpenTrending={() => router.push("/trending")}
            onOpenBilling={() => router.push("/billing")}
          />
        ) : (
          isSignedIn ? (
            <Link href="/" className="primary home-nav-signin">
              Home
            </Link>
          ) : (
            <Link href="/sign-in" className="primary home-nav-signin">
              Sign in
            </Link>
          )
        )}
      </nav>
    </header>
  );
}
