import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("mark expired cards", { hours: 12 }, internal.cards.markExpired, {});

export default crons;
