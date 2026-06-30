import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { AppProviders } from "@/components/app-providers";
import { getClerkPublishableKey } from "@/lib/clerk";

const signUpAppearance = {
  elevation: "flush",
  variables: {
    colorBackground: "transparent",
    colorInputBackground: "#f6f4ef",
    colorForeground: "#141414",
    colorTextSecondary: "#666",
    colorPrimary: "#f43d38",
    colorDanger: "#f43d38",
    colorBorder: "#b7b4ae",
    borderRadius: "0px",
    fontFamily: "var(--font-inter, Inter, sans-serif)",
    fontSize: "13px",
  },
  elements: {
    rootBox: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
    },
    cardBox: {
      display: "block",
      width: "100%",
      maxWidth: "100%",
      padding: "0",
      margin: "0",
      border: "0",
      background: "transparent",
      boxShadow: "none",
    },
    card: {
      display: "block",
      background: "transparent",
      boxShadow: "none",
      border: "0",
      width: "100%",
      maxWidth: "100%",
      margin: "0",
      padding: "0",
      minWidth: "0",
    },
    footer: {
      background: "transparent",
      padding: "0",
      margin: "0",
      border: "0",
      boxShadow: "none",
    },
    footerActionLink: {
      fontFamily: "var(--font-inter, Inter, sans-serif)",
      fontSize: "12px",
      color: "#666",
    },
    footerActionText: {
      fontFamily: "var(--font-inter, Inter, sans-serif)",
      fontSize: "12px",
      color: "#666",
    },
    headerTitle: {
      display: "none",
    },
    headerSubtitle: {
      display: "none",
    },
    socialButtonsBlockButton: {
      width: "100%",
      display: "block",
      borderRadius: "0",
      border: "1px solid #b7b4ae",
      background: "#fff",
      color: "#141414",
      boxShadow: "none",
      fontWeight: "800",
    },
    dividerLine: {
      background: "#d4d0c8",
    },
    formFieldLabel: {
      fontFamily: "var(--font-inter, Inter, sans-serif)",
      fontSize: "11px",
      fontWeight: "600",
      color: "#555",
      textTransform: "uppercase" as const,
      letterSpacing: "0.4px",
    },
    formFieldInput: {
      display: "block",
      width: "100%",
      background: "#f6f4ef",
      border: "1px solid #b7b4ae",
      borderRadius: "0",
      color: "#141414",
      fontFamily: "var(--font-inter, Inter, sans-serif)",
      fontSize: "14px",
    },
    formButtonPrimary: {
      width: "100%",
      display: "block",
      fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
      fontWeight: "900",
      fontSize: "13px",
      background: "#1a1a18",
      color: "#f5f1e8",
      borderRadius: "0",
      boxShadow: "none",
      minHeight: "40px",
    },
    identityPreviewText: {
      fontFamily: "var(--font-inter, Inter, sans-serif)",
      fontSize: "12px",
      color: "#666",
    },
    identityPreviewEditButton: {
      fontFamily: "var(--font-inter, Inter, sans-serif)",
      fontSize: "11px",
      color: "#f43d38",
    },
  },
} as const;

export default function SignUpPage() {
  const clerkPublishableKey = getClerkPublishableKey();

  return (
    <AppProviders clerkPublishableKey={clerkPublishableKey}>
      <main className="nf-page sign-in-page">
        <div className="nf-grain" />
        <div className="nf-ghost nf-ghost-1" aria-hidden="true" />
        <div className="nf-ghost nf-ghost-2" aria-hidden="true" />
        <div className="nf-ghost nf-ghost-3" aria-hidden="true" />

        <div className="nf-card sign-in-card">
          <div className="nf-tape" aria-hidden="true" />
          <div className="nf-stamp" aria-hidden="true">SIGN UP</div>

          <p className="nf-eyebrow">Notice · LocalWall access</p>
          <h1 className="nf-headline">Join LocalWall.</h1>
          <p className="nf-body">
            Create your account to post, manage, and track your listings on the wall.
          </p>

          <div className="sign-in-panel">
            <SignUp appearance={signUpAppearance} />
            <Link href="/" className="nf-btn-secondary sign-in-home-link sign-in-back-inline">
              Back to wall
            </Link>
          </div>

          <p className="sign-in-signup-link">
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </p>

          <div className="nf-card-footer sign-in-footer">
            <span>LocalWall</span>
            <span>your local bulletin board</span>
          </div>
        </div>

        <p className="nf-brand">WALL</p>
      </main>
    </AppProviders>
  );
}
