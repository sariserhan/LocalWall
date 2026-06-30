"use client";

import { UserButton } from "@clerk/nextjs";
import { BriefcaseBusiness, CreditCard, Download, LayoutDashboard, ShieldCheck, TrendingUp } from "lucide-react";
import { getClerkUserButtonAppearance, getClerkUserProfileAppearance } from "@/lib/clerk-appearance";
import { ClerkBusinessPage } from "@/features/wall/clerk-business-page";
import { ClerkMyDataPage } from "@/features/wall/clerk-my-data-page";

type ClerkProfile = {
  displayName: string | null;
  username: string | null;
  businessName: string | null;
  verified: boolean;
} | null | undefined;

type ClerkAvatarMenuProps = {
  isDark: boolean;
  profile: ClerkProfile;
  isReady: boolean;
  onUpdateBusinessName: (businessName: string | undefined) => Promise<void>;
  onOpenAdminPanel?: () => void;
  onOpenDashboard?: () => void;
  onOpenTrending?: () => void;
  onOpenBilling?: () => void;
};

export function ClerkAvatarMenu({
  isDark,
  profile,
  isReady,
  onUpdateBusinessName,
  onOpenAdminPanel,
  onOpenDashboard,
  onOpenTrending,
  onOpenBilling,
}: ClerkAvatarMenuProps) {
  return (
    <UserButton
      appearance={getClerkUserButtonAppearance(isDark)}
      userProfileProps={{
        appearance: getClerkUserProfileAppearance(isDark),
        apiKeysProps: { hide: true },
      }}
    >
      <UserButton.UserProfilePage key="business-profile" label="Business profile" url="business-profile" labelIcon={<BriefcaseBusiness size={16} />}>
        <ClerkBusinessPage
          profile={profile}
          isReady={isReady}
          onUpdateBusinessName={onUpdateBusinessName}
        />
      </UserButton.UserProfilePage>
      <UserButton.UserProfilePage key="my-data" label="My data" url="my-data" labelIcon={<Download size={16} />}>
        <ClerkMyDataPage />
      </UserButton.UserProfilePage>
      <UserButton.MenuItems>
        {onOpenAdminPanel ? (
          <UserButton.Action
            label="Admin"
            labelIcon={<ShieldCheck size={16} />}
            onClick={onOpenAdminPanel}
          />
        ) : null}
        {onOpenDashboard ? (
          <UserButton.Action
            label="My board"
            labelIcon={<LayoutDashboard size={16} />}
            onClick={onOpenDashboard}
          />
        ) : null}
        {onOpenTrending ? (
          <UserButton.Action
            label="Trending"
            labelIcon={<TrendingUp size={16} />}
            onClick={onOpenTrending}
          />
        ) : null}
        {onOpenBilling ? (
          <UserButton.Action
            label="Manage billing"
            labelIcon={<CreditCard size={16} />}
            onClick={onOpenBilling}
          />
        ) : null}
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
