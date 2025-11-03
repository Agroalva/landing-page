import { defineSchema } from "convex/server";
import { profilesTable } from "./schema/profiles";
import { postsTable } from "./schema/posts";
import { conversationsTable } from "./schema/conversations";
import { messagesTable } from "./schema/messages";
import { productsTable } from "./schema/products";

export default defineSchema({
    // Better Auth will create internal tables automatically
    // We only define app-specific tables here

    profiles: profilesTable,
    posts: postsTable,
    conversations: conversationsTable,
    messages: messagesTable,
    products: productsTable,
});

