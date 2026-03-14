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

export default http;
