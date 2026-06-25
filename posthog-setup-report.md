<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into LocalWall, a Next.js 16 App Router application. PostHog is initialized via `instrumentation-client.ts` using the recommended singleton approach for Next.js 15.3+. A reverse proxy through `/ingest` is configured in `next.config.ts` to reduce ad-blocker interference. A server-side client is available at `src/lib/posthog-server.ts` for API route tracking. User identification is wired to Clerk auth state in `connected-wall-app.tsx`, calling `posthog.identify()` when authenticated and `posthog.reset()` on sign-out.

| Event | Description | File |
|---|---|---|
| `card_composer_opened` | User opens the card creation composer to start posting a new listing. | `src/features/wall/wall-app.tsx` |
| `card_checkout_started` | User submits a paid card draft and is redirected to Stripe checkout. | `src/features/wall/connected-wall-app.tsx` |
| `card_created` | User successfully creates a free card without going through Stripe checkout. | `src/features/wall/connected-wall-app.tsx` |
| `card_liked` | User likes or unlikes a card on the wall. | `src/features/wall/connected-wall-app.tsx` |
| `card_saved` | User saves or unsaves a card to their bookmarks. | `src/features/wall/connected-wall-app.tsx` |
| `wall_saved` | User saves or unsaves a local wall as a favourite. | `src/features/wall/connected-wall-app.tsx` |
| `digest_subscribed` | User subscribes to the weekly local digest email for a city. | `src/features/wall/wall-app.tsx` |
| `card_deleted` | Owner permanently deletes one of their cards from the dashboard. | `src/features/wall/owner-dashboard.tsx` |
| `card_renewed` | Owner initiates a card renewal (free or paid) from the dashboard. | `src/features/wall/owner-dashboard.tsx` |
| `verification_checkout_started` | User starts the Stripe checkout flow to purchase a verified business badge. | `src/features/wall/owner-dashboard.tsx` |
| `checkout_started` | Stripe checkout session successfully created (posting, renewal, bundle, or verification). | `app/api/stripe/checkout/route.ts` |
| `checkout_failed` | Stripe checkout session creation failed due to an API or validation error. | `app/api/stripe/checkout/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/68971/dashboard/1758250)
- [Card Posting Funnel](https://us.posthog.com/project/68971/insights/bJLE8gDp)
- [Checkout Starts Over Time](https://us.posthog.com/project/68971/insights/IRkU2ZNG)
- [Card Engagement: Likes & Saves](https://us.posthog.com/project/68971/insights/fLQJHXKL)
- [Card Deletions (Churn Signal)](https://us.posthog.com/project/68971/insights/YVoChBZu)
- [Weekly Digest Subscriptions](https://us.posthog.com/project/68971/insights/Z4AjynS5)

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the current `useEffect` in `connected-wall-app.tsx` fires on every auth state change, but verify that Clerk's session restore on page reload correctly re-triggers the authenticated state so returning users are identified, not left on anonymous distinct IDs.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
