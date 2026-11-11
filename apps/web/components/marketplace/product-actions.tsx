"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Ban, MessageCircle, Pencil, Share2, Trash2 } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { FavoriteButton } from "./favorite-button";
import { ListingStatusControls } from "./listing-status-controls";
import { useLiveListingStatus } from "./product-status-banner";
import { Button } from "@/components/ui/button";
import type { ListingStatus } from "../../../app/config/listing-status";

type ProductActionsProps = {
    productId: string;
    authorId: string;
    productName: string;
    type: "rent" | "sell";
    initialStatus?: ListingStatus;
};

export function ProductActions({ productId, authorId, productName, type, initialStatus }: ProductActionsProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthSession();
    const [busy, setBusy] = useState(false);
    const ensureConversation = useMutation(api.conversations.ensureConversation);
    const deleteProduct = useMutation(api.products.deleteProduct);
    const status = useLiveListingStatus(productId, initialStatus);
    const isOwner = user?.id === authorId;
    const isAvailable = status === "active";

    const contact = async () => {
        if (!isAuthenticated || !user?.id) {
            router.push(`/sign-in?redirect=${encodeURIComponent(`/product/${productId}`)}`);
            return;
        }
        setBusy(true);
        try {
            const conversationId = await ensureConversation({ memberIds: [user.id, authorId], productId: productId as Id<"products">, source: "web" });
            router.push(`/messages/${conversationId}`);
        } finally { setBusy(false); }
    };

    const remove = async () => {
        if (!window.confirm(`¿Eliminar “${productName}”? Esta acción no se puede deshacer y se pierden las visitas y los favoritos. Si ya la vendiste o querés ocultarla un tiempo, podés marcarla como vendida o pausarla.`)) return;
        setBusy(true);
        try {
            await deleteProduct({ productId: productId as Id<"products"> });
            router.push("/my-listings");
        } finally { setBusy(false); }
    };

    const share = async () => {
        const url = window.location.href;
        if (navigator.share) await navigator.share({ title: productName, url });
        else await navigator.clipboard.writeText(url);
    };

    return (
        <div className="space-y-3">
            {isOwner ? (
                <>
                    <Button asChild className="h-12 w-full rounded-full bg-emerald-800"><a href={`/product/${productId}/edit`}><Pencil className="size-4" /> Editar publicación</a></Button>
                    <ListingStatusControls productId={productId} type={type} status={status} size="lg" />
                    <Button type="button" variant="outline" className="h-12 w-full rounded-full text-red-700" onClick={remove} disabled={busy}><Trash2 className="size-4" /> Eliminar</Button>
                </>
            ) : (
                <>
                    {isAvailable ? (
                        <Button type="button" className="h-12 w-full rounded-full bg-emerald-800 text-base" onClick={contact} disabled={busy}><MessageCircle className="size-5" /> {busy ? "Abriendo..." : "Contactar"}</Button>
                    ) : (
                        <Button type="button" className="h-12 w-full rounded-full text-base" variant="secondary" disabled><Ban className="size-5" /> No disponible</Button>
                    )}
                    <FavoriteButton productId={productId} />
                </>
            )}
            <Button type="button" variant="ghost" className="h-11 w-full rounded-full" onClick={share}><Share2 className="size-4" /> Compartir</Button>
        </div>
    );
}
