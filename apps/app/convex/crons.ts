import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "refresh USD/ARS exchange rate",
    { hours: 1 },
    internal.exchangeRates.refreshUsdArs,
    {},
);

export default crons;
