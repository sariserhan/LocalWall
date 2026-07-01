import { createFrontendApiProxyHandlers } from "@clerk/nextjs/server";
import { getClerkPublishableKey } from "@/lib/clerk";

const publishableKey = getClerkPublishableKey();
const secretKey = process.env.CLERK_SECRET_KEY;

export const { GET, POST, PUT, DELETE, PATCH } = createFrontendApiProxyHandlers({
  proxyPath: "/__clerk",
  publishableKey,
  secretKey,
});
