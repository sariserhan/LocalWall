import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { getClerkPublishableKey } from "@/lib/clerk";

const clerkProxy = getClerkPublishableKey()
  ? clerkMiddleware({
      frontendApiProxy: {
        enabled: true,
      },
    })
  : null;

export default function proxy(request: NextRequest, event: Parameters<NonNullable<typeof clerkProxy>>[1]) {
  return clerkProxy ? clerkProxy(request, event) : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
