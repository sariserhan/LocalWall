import { AppProviders } from "@/components/app-providers";
import { getClerkPublishableKey } from "@/lib/clerk";
import { UnsubscribeClient } from "./unsubscribe-client";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
  const clerkPublishableKey = getClerkPublishableKey();
  return (
    <AppProviders convexUrl={convexUrl} clerkPublishableKey={clerkPublishableKey} withClerk={false}>
      <UnsubscribeClient token={token ?? ""} />
    </AppProviders>
  );
}
