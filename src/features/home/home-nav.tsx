"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/use-theme";

export function HomeNav() {
  const { isSignedIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="home-nav">
      <Link href="/" className="home-nav-brand">
        <strong>LocalWall</strong>
        <small>your local bulletin board</small>
      </Link>
      <nav className="home-nav-right">
        {/* <Link href="/us" className="home-nav-link">Browse ads</Link> */}
        {isSignedIn ? (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                labelIcon={isDark ? <Sun size={14} /> : <Moon size={14} />}
                onClick={toggleTheme}
              />
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
