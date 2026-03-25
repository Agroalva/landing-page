import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
    path: "/public/product-share",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("id")?.trim();

        if (!productId) {
            return Response.json(
                { error: "Missing product id" },
                { status: 400 },
            );
        }

        try {
            const product = await ctx.runQuery(api.products.getShareById, {
                productId: productId as Id<"products">,
            });

            if (!product) {
                return Response.json(
                    { error: "Product not found" },
                    { status: 404 },
                );
            }

            return Response.json(product, {
                status: 200,
                headers: {
                    "Cache-Control": "public, max-age=60",
                    "Content-Type": "application/json",
                },
            });
        } catch {
            return Response.json(
                { error: "Invalid product id" },
                { status: 400 },
            );
        }
    }),
});

http.route({
    path: "/public/storage-image",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const { searchParams } = new URL(request.url);
        const storageId = searchParams.get("storageId")?.trim();

        console.log("[storage-image] request", {
            url: request.url,
            storageId: storageId ?? null,
        });

        if (!storageId) {
            console.warn("[storage-image] missing storage id");
            return Response.json(
                { error: "Missing storage id" },
                { status: 400 },
            );
        }

        try {
            const blob = await ctx.storage.get(storageId as Id<"_storage">);

            if (!blob) {
                console.warn("[storage-image] image not found", { storageId });
                return Response.json(
                    { error: "Image not found" },
                    { status: 404 },
                );
            }

            console.log("[storage-image] serving blob", {
                storageId,
                contentType: blob.type || "application/octet-stream",
                size: blob.size,
            });

            return new Response(blob, {
                status: 200,
                headers: {
                    "Cache-Control": "public, max-age=3600",
                    "Content-Type": blob.type || "application/octet-stream",
                },
            });
        } catch {
            console.error("[storage-image] invalid storage id", { storageId });
            return Response.json(
                { error: "Invalid storage id" },
                { status: 400 },
            );
        }
    }),
});

export default http;
