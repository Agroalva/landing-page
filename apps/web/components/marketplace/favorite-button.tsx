"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";

export function FavoriteButton({ productId, compact = false }: { productId: string; compact?: boolean }) {
    const { isAuthenticated } = useAuthSession();
    const typedId = productId as Id<"products">;
    const isFavorite = useQuery(api.favorites.isFavorite, isAuthenticated ? { productId: typedId } : "skip");
    const toggleFavorite = useMutation(api.favorites.toggleFavorite);

    if (!isAuthenticated) {
        return (
            <Button asChild size={compact ? "icon" : "default"} variant="outline" className="rounded-full bg-white/95">
                <Link href={`/sign-in?redirect=${encodeURIComponent(`/product/${productId}`)}`} aria-label="Guardar en favoritos">
                    <Heart className="size-4" />{compact ? null : "Guardar"}
                </Link>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            size={compact ? "icon" : "default"}
            variant={isFavorite ? "default" : "outline"}
            className={`rounded-full ${isFavorite ? "bg-emerald-800" : "bg-white/95"}`}
            onClick={() => void toggleFavorite({ productId: typedId })}
            aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
            <Heart className={`size-4 ${isFavorite ? "fill-current" : ""}`} />{compact ? null : isFavorite ? "Guardado" : "Guardar"}
        </Button>
    );
}
