import { defineSchema } from "convex/server";
import { profilesTable } from "./schema/profiles";
import { conversationsTable } from "./schema/conversations";
import { messagesTable } from "./schema/messages";
import { productsTable } from "./schema/products";
import { favoritesTable } from "./schema/favorites";
import {
    notificationsTable,
    pushDevicesTable,
    chatPushStatesTable,
    webPushSubscriptionsTable,
} from "./schema/notifications";
import { bannersTable } from "./schema/banners";
import { reviewsTable, reviewReportsTable } from "./schema/reviews";
import {
    productContactEventsTable,
    productDailyStatsTable,
    productStatsTable,
} from "./schema/productStats";
import { exchangeRatesTable } from "./schema/exchangeRates";
import { savedSearchesTable, savedSearchAlertsTable } from "./schema/savedSearches";
import { priceDropAlertsTable } from "./schema/priceDropAlerts";

export default defineSchema({
    // Better Auth will create internal tables automatically
    // Presence component creates its own tables automatically
    // We only define app-specific tables here

    profiles: profilesTable,
    conversations: conversationsTable,
    messages: messagesTable,
    products: productsTable,
    favorites: favoritesTable,
    notifications: notificationsTable,
    pushDevices: pushDevicesTable,
    webPushSubscriptions: webPushSubscriptionsTable,
    chatPushStates: chatPushStatesTable,
    banners: bannersTable,
    reviews: reviewsTable,
    reviewReports: reviewReportsTable,
    productContactEvents: productContactEventsTable,
    productStats: productStatsTable,
    productDailyStats: productDailyStatsTable,
    exchangeRates: exchangeRatesTable,
    savedSearches: savedSearchesTable,
    savedSearchAlerts: savedSearchAlertsTable,
    priceDropAlerts: priceDropAlertsTable,
});
