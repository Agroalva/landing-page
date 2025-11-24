import { defineSchema } from "convex/server";
import { profilesTable } from "./schema/profiles";
import { conversationsTable } from "./schema/conversations";
import { messagesTable } from "./schema/messages";
import { productsTable } from "./schema/products";
import { favoritesTable } from "./schema/favorites";
import { notificationsTable } from "./schema/notifications";

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
});

