import { AppProviders } from "@/components/app-providers";
import { ConnectedWallApp } from "@/features/wall/connected-wall-app";
import { WallApp } from "@/features/wall/wall-app";

export default function HomePage() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isConnected = Boolean(convexUrl && clerkPublishableKey);

  return (
    <AppProviders convexUrl={convexUrl} clerkPublishableKey={clerkPublishableKey}>
      {isConnected ? <ConnectedWallApp /> : <WallApp mode="demo" />}
    </AppProviders>
  );
}
