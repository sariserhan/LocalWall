"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { BriefcaseBusiness, CreditCard, Download, LayoutDashboard, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/use-theme";
import { getClerkUserButtonAppearance, getClerkUserProfileAppearance } from "@/lib/clerk-appearance";
import { api } from "../../../convex/_generated/api";
import { openAdminPanel } from "@/lib/admin-signal";
import { openDashboard } from "@/lib/dashboard-signal";
import { ClerkBusinessPage } from "../wall/clerk-business-page";
import { ClerkMyDataPage } from "../wall/clerk-my-data-page";
import { HomePostButton } from "./home-post-button";

export function HomeNav() {
  const { isSignedIn } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isTrending = pathname === "/trending";
  const adminAccess = useQuery(api.admin.getAccess, isSignedIn ? {} : "skip") as { isAdmin: boolean } | undefined;
  const profile = useQuery(api.cards.getMyProfile, isSignedIn ? {} : "skip") as { displayName: string | null; username: string | null; businessName: string | null; verified: boolean } | null | undefined;
  const updateProfile = useMutation(api.cards.updateProfile);

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
        {isSignedIn ? (
          <UserButton
            appearance={getClerkUserButtonAppearance(isDark)}
            userProfileProps={{
              appearance: getClerkUserProfileAppearance(isDark),
              apiKeysProps: { hide: true },
            }}
          >
            <UserButton.UserProfilePage key="home-business-profile" label="Business profile" url="business-profile" labelIcon={<BriefcaseBusiness size={16} />}>
              <ClerkBusinessPage
                profile={profile}
                isReady={profile !== undefined}
                onUpdateBusinessName={async (businessName) => { await updateProfile({ businessName }); }}
              />
            </UserButton.UserProfilePage>
            <UserButton.UserProfilePage key="home-my-data" label="My data" url="my-data" labelIcon={<Download size={16} />}>
              <ClerkMyDataPage />
            </UserButton.UserProfilePage>
            <UserButton.MenuItems>
              {adminAccess?.isAdmin ? (
                <UserButton.Action
                  label="Admin"
                  labelIcon={<ShieldCheck size={16} />}
                  onClick={() => openAdminPanel()}
                />
              ) : null}
              <UserButton.Action
                label="My board"
                labelIcon={<LayoutDashboard size={16} />}
                onClick={() => openDashboard()}
              />
              <UserButton.Action
                label="Trending"
                labelIcon={<TrendingUp size={16} />}
                onClick={() => router.push("/trending")}
              />
              <UserButton.Action
                label="Manage billing"
                labelIcon={<CreditCard size={16} />}
                onClick={() => router.push("/billing")}
              />
              <UserButton.Action label="manageAccount" />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <SignInButton mode="modal">
            <button className="primary home-nav-signin">Sign in</button>
          </SignInButton>
        )}
      </nav>
    </header>
  );
}
