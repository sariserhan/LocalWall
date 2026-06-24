import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("mark expired cards", { hours: 12 }, internal.cards.markExpired, {});
crons.interval("send expiration reminders", { hours: 12 }, internal.reminders.sendExpirationReminders, {});
crons.weekly("send weekly digest", { dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 }, internal.digest.sendWeeklyDigests, {});

export default crons;
