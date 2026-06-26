/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as bugReports from "../bugReports.js";
import type * as cards from "../cards.js";
import type * as contactMessages from "../contactMessages.js";
import type * as crons from "../crons.js";
import type * as digest from "../digest.js";
import type * as gdpr from "../gdpr.js";
import type * as http from "../http.js";
import type * as payments from "../payments.js";
import type * as paymentsInternal from "../paymentsInternal.js";
import type * as rateLimits from "../rateLimits.js";
import type * as reminders from "../reminders.js";
import type * as reviews from "../reviews.js";
import type * as savedCards from "../savedCards.js";
import type * as savedWalls from "../savedWalls.js";
import type * as users from "../users.js";
import type * as walls from "../walls.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  bugReports: typeof bugReports;
  cards: typeof cards;
  contactMessages: typeof contactMessages;
  crons: typeof crons;
  digest: typeof digest;
  gdpr: typeof gdpr;
  http: typeof http;
  payments: typeof payments;
  paymentsInternal: typeof paymentsInternal;
  rateLimits: typeof rateLimits;
  reminders: typeof reminders;
  reviews: typeof reviews;
  savedCards: typeof savedCards;
  savedWalls: typeof savedWalls;
  users: typeof users;
  walls: typeof walls;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
