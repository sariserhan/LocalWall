"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/use-theme";
import { clerkUserButtonAppearance } from "@/lib/clerk-appearance";

export function HomeNav() {
  const { isSignedIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <header className="home-nav">
      <Link href="/" className="home-nav-brand">
        <strong>LocalWall</strong>
        <small>your local bulletin board</small>
      </Link>
      <nav className="home-nav-right">
        {isSignedIn ? (
          <UserButton appearance={clerkUserButtonAppearance}>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My board"
                labelIcon={<LayoutDashboard size={16} />}
                onClick={() => router.push("/us")}
              />
              <UserButton.Action label="manageAccount" />
              <UserButton.Action
                label={isDark ? "Light mode" : "Dark mode"}
                labelIcon={isDark ? <Sun size={16} /> : <Moon size={16} />}
                onClick={toggleTheme}
              />
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
