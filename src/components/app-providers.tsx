"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState } from "react";

interface AppProvidersProps {
  children: React.ReactNode;
  clerkPublishableKey?: string;
  convexUrl?: string;
}

export function AppProviders({ children, clerkPublishableKey, convexUrl }: AppProvidersProps) {
  if (!clerkPublishableKey || !convexUrl) return children;

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      localization={{
        signIn: {
          start: {
            title: "Sign in to LocalWall",
            subtitle: "Sign in to post and manage your local listings",
          },
        },
        signUp: {
          start: {
            title: "Join LocalWall",
            subtitle: "Create an account to post listings and track your reach",
          },
        },
      }}
    >
      <ConnectedProviders convexUrl={convexUrl}>{children}</ConnectedProviders>
    </ClerkProvider>
  );
}

function ConnectedProviders({ children, convexUrl }: { children: React.ReactNode; convexUrl: string }) {
  const [convex] = useState(() => new ConvexReactClient(convexUrl));
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
