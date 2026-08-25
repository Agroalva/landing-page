"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { MessageCircle, Pencil, Share2, Trash2 } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { FavoriteButton } from "./favorite-button";
import { Button } from "@/components/ui/button";

export function ProductActions({ productId, authorId, productName }: { productId: string; authorId: string; productName: string }) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthSession();
    const [busy, setBusy] = useState(false);
    const ensureConversation = useMutation(api.conversations.ensureConversation);
    const deleteProduct = useMutation(api.products.deleteProduct);
    const isOwner = user?.id === authorId;

    const contact = async () => {
        if (!isAuthenticated || !user?.id) {
            router.push(`/sign-in?redirect=${encodeURIComponent(`/product/${productId}`)}`);
            return;
        }
        setBusy(true);
        try {
            const conversationId = await ensureConversation({ memberIds: [user.id, authorId] });
            router.push(`/messages/${conversationId}`);
        } finally { setBusy(false); }
    };

    const remove = async () => {
        if (!window.confirm(`¿Eliminar “${productName}”? Esta acción no se puede deshacer.`)) return;
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
                    <Button type="button" variant="outline" className="h-12 w-full rounded-full text-red-700" onClick={remove} disabled={busy}><Trash2 className="size-4" /> Eliminar</Button>
                </>
            ) : (
                <>
                    <Button type="button" className="h-12 w-full rounded-full bg-emerald-800 text-base" onClick={contact} disabled={busy}><MessageCircle className="size-5" /> {busy ? "Abriendo..." : "Contactar"}</Button>
                    <FavoriteButton productId={productId} />
                </>
            )}
            <Button type="button" variant="ghost" className="h-11 w-full rounded-full" onClick={share}><Share2 className="size-4" /> Compartir</Button>
        </div>
    );
}
