"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export function HomeNav() {
  const { isSignedIn } = useAuth();
  return (
    <header className="home-nav">
      <Link href="/" className="home-nav-brand">
        <Image
          src="/assets/logo-small.png"
          alt="LocalWall"
          width={1916}
          height={821}
          style={{ height: 40, width: "auto" }}
          priority
        />
      </Link>
      <nav className="home-nav-right">
        <Link href="/us" className="home-nav-link">Browse ads</Link>
        {isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton mode="modal">
            <button className="primary home-nav-signin">Sign in</button>
          </SignInButton>
        )}
      </nav>
    </header>
  );
}
