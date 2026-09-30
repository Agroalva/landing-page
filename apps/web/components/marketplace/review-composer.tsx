"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, MessageCircle, ShieldCheck, Trash2 } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";

const RATING_LABELS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];

type ExistingReview = {
    _id: Id<"reviews">;
    productId?: Id<"products">;
    rating: number;
    comment: string;
};

type EligibleProduct = {
    productId: Id<"products">;
    name: string;
};

export function ReviewComposer({ userId }: { userId: string }) {
    const profile = useQuery(api.marketplace.getPublicProfile, { userId });
    const eligibility = useQuery(api.reviews.getReviewEligibility, { reviewedUserId: userId });
    const existingReview = useQuery(api.reviews.getMyReviewForUser, { reviewedUserId: userId });

    if (profile === undefined || eligibility === undefined || existingReview === undefined) {
        return <div className="mx-auto my-20 h-96 max-w-3xl animate-pulse rounded-[2rem] bg-stone-100" />;
    }

    if (profile === null) {
        return (
            <main className="mx-auto min-h-[70vh] max-w-xl px-6 py-20 text-center">
                <h1 className="text-3xl font-black text-stone-950">Perfil no disponible</h1>
                <Button asChild variant="outline" className="mt-7 rounded-full">
                    <Link href="/">Volver al mercado</Link>
                </Button>
            </main>
        );
    }

    if (!existingReview && !eligibility.canReview) {
        return (
            <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16">
                <div className="w-full rounded-[2rem] border border-emerald-950/10 bg-white p-8 text-center shadow-[0_24px_80px_rgba(24,61,40,0.10)]">
                    <MessageCircle className="mx-auto size-12 text-stone-400" />
                    <h1 className="mt-5 text-3xl font-black text-stone-950">Aún no podés calificar</h1>
                    <p className="mt-3 leading-7 text-stone-600">
                        Para proteger la reputación de la comunidad, ambos usuarios deben haber enviado al menos un mensaje en una conversación de Agroalva.
                    </p>
                    <Button asChild variant="outline" className="mt-7 rounded-full">
                        <Link href={`/profile/${userId}`}>Volver al perfil</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <ReviewForm
            key={existingReview?._id ?? "new-review"}
            userId={userId}
            displayName={profile.displayName}
            existingReview={existingReview}
            products={eligibility.products}
        />
    );
}

function ReviewForm({
    userId,
    displayName,
    existingReview,
    products,
}: {
    userId: string;
    displayName: string;
    existingReview: ExistingReview | null;
    products: EligibleProduct[];
}) {
    const router = useRouter();
    const [rating, setRating] = useState(existingReview?.rating ?? 0);
    const [comment, setComment] = useState(existingReview?.comment ?? "");
    const [productId, setProductId] = useState<Id<"products"> | undefined>(
        existingReview?.productId ?? (products.length === 1 ? products[0]?.productId : undefined),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const createReview = useMutation(api.reviews.create);
    const updateReview = useMutation(api.reviews.update);
    const removeReview = useMutation(api.reviews.remove);

    const canSubmit = rating >= 1 && comment.trim().length >= 10 && comment.trim().length <= 1000;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;
        setIsSaving(true);
        setError(null);
        try {
            if (existingReview) {
                await updateReview({ reviewId: existingReview._id, rating, comment, productId });
            } else {
                await createReview({ reviewedUserId: userId, rating, comment, productId });
            }
            router.push(`/profile/${userId}`);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!existingReview || !window.confirm("¿Eliminar tu reseña? Dejará de formar parte del promedio.")) return;
        setIsSaving(true);
        setError(null);
        try {
            await removeReview({ reviewId: existingReview._id });
            router.push(`/profile/${userId}`);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f7f6ef] px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-3xl">
                <Link href={`/profile/${userId}`} className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-emerald-800">
                    <ArrowLeft className="size-4" /> Volver al perfil
                </Link>
                <form onSubmit={handleSubmit} className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-[0_24px_80px_rgba(24,61,40,0.10)]">
                    <div className="border-b border-emerald-950/10 bg-[radial-gradient(circle_at_top_left,#dcebc7,transparent_52%),#f7f6ef] p-7 sm:p-9">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Interacción verificada</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">
                            {existingReview ? "Editá tu reseña" : `Calificá a ${displayName}`}
                        </h1>
                        <p className="mt-3 max-w-2xl leading-7 text-stone-600">Tu calificación y comentario serán públicos en el perfil de este usuario.</p>
                    </div>

                    <div className="space-y-7 p-7 sm:p-9">
                        <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                            <ShieldCheck className="mr-2 inline size-5 align-text-bottom text-emerald-700" />
                            Solo podés reseñar a usuarios con quienes ambos hayan participado en una conversación.
                        </div>

                        <fieldset>
                            <legend className="font-black text-stone-900">Tu calificación</legend>
                            <div className="mt-3 flex flex-col items-start gap-2 rounded-2xl border bg-stone-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <StarRating value={rating} onChange={setRating} size="lg" />
                                <span className="text-sm font-semibold text-stone-600">{rating ? RATING_LABELS[rating] : "Elegí de 1 a 5 estrellas"}</span>
                            </div>
                        </fieldset>

                        {products.length > 0 && (
                            <label className="block font-black text-stone-900">
                                Publicación relacionada <span className="font-normal text-stone-500">(opcional)</span>
                                <select
                                    value={productId ?? ""}
                                    onChange={(event) => setProductId(event.target.value ? event.target.value as Id<"products"> : undefined)}
                                    className="mt-3 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 font-normal text-stone-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                                >
                                    <option value="">Sin publicación</option>
                                    {products.map((product) => <option key={product.productId} value={product.productId}>{product.name}</option>)}
                                </select>
                            </label>
                        )}

                        <label className="block font-black text-stone-900">
                            Contá tu experiencia
                            <Textarea
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                maxLength={1000}
                                rows={7}
                                placeholder="Describí la comunicación, el cumplimiento y el trato recibido..."
                                className="mt-3 min-h-40 resize-y rounded-2xl p-4 font-normal leading-7"
                            />
                            <span className="mt-2 flex justify-between text-xs font-normal text-stone-500">
                                <span>Mínimo 10 caracteres</span><span>{comment.length}/1000</span>
                            </span>
                        </label>

                        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="submit" disabled={!canSubmit || isSaving} className="h-12 flex-1 rounded-full bg-emerald-800 text-base hover:bg-emerald-900">
                                {isSaving ? "Guardando..." : existingReview ? "Guardar cambios" : "Publicar reseña"}
                            </Button>
                            {existingReview && (
                                <Button type="button" variant="outline" disabled={isSaving} onClick={handleRemove} className="h-12 rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                                    <Trash2 className="size-4" /> Eliminar
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}

function getErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "data" in error && typeof error.data === "string") return error.data;
    return error instanceof Error ? error.message : "No se pudo guardar la reseña";
}
