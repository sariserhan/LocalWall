import { AppProviders } from "@/components/app-providers";
import { UnsubscribeClient } from "./unsubscribe-client";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  return (
    <AppProviders convexUrl={convexUrl} clerkPublishableKey={clerkPublishableKey}>
      <UnsubscribeClient token={token ?? ""} />
    </AppProviders>
  );
}
