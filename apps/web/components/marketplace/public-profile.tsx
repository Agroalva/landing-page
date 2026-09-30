"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { CalendarDays, Flag, MessageCircle, Pencil, ShieldCheck, Star, UserRound } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { MarketplaceListing } from "@/lib/marketplace";
import { formatShortDate } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import { StarRating } from "./star-rating";

export function PublicProfile({ userId }: { userId: string }) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthSession();
    const [isOpeningChat, setIsOpeningChat] = useState(false);
    const [reportedReviewIds, setReportedReviewIds] = useState<Set<string>>(() => new Set());
    const [actionError, setActionError] = useState<string | null>(null);
    const profile = useQuery(api.marketplace.getPublicProfile, { userId });
    const myReview = useQuery(
        api.reviews.getMyReviewForUser,
        isAuthenticated ? { reviewedUserId: userId } : "skip",
    );
    const { results: reviews, status: reviewStatus, loadMore } = usePaginatedQuery(
        api.reviews.listForUser,
        { reviewedUserId: userId },
        { initialNumItems: 5 },
    );
    const ensureConversation = useMutation(api.conversations.ensureConversation);
    const reportReview = useMutation(api.reviews.report);
    const isOwnProfile = user?.id === userId;

    if (profile === undefined) {
        return <div className="mx-auto my-20 h-96 max-w-7xl animate-pulse rounded-3xl bg-stone-100" />;
    }

    if (profile === null) {
        return (
            <main className="mx-auto min-h-[70vh] max-w-xl px-6 py-20 text-center">
                <UserRound className="mx-auto size-12 text-stone-400" />
                <h1 className="mt-5 text-3xl font-black">Perfil no disponible</h1>
            </main>
        );
    }

    const openConversation = async () => {
        if (!isAuthenticated || !user?.id) {
            router.push(`/sign-in?redirect=${encodeURIComponent(`/profile/${userId}`)}`);
            return;
        }
        setIsOpeningChat(true);
        setActionError(null);
        try {
            const conversationId = await ensureConversation({ memberIds: [user.id, userId] });
            router.push(`/messages/${conversationId}`);
        } catch (error) {
            setActionError(getErrorMessage(error));
            setIsOpeningChat(false);
        }
    };

    const report = async (reviewId: Id<"reviews">) => {
        if (!isAuthenticated) {
            router.push(`/sign-in?redirect=${encodeURIComponent(`/profile/${userId}`)}`);
            return;
        }
        if (!window.confirm("¿Reportar esta reseña para que el equipo de Agroalva la revise?")) return;
        setActionError(null);
        try {
            await reportReview({ reviewId, reason: "inappropriate" });
            setReportedReviewIds((current) => new Set(current).add(reviewId));
        } catch (error) {
            setActionError(getErrorMessage(error));
        }
    };

    return (
        <main className="min-h-screen bg-[#f7f6ef]">
            <section className="border-b border-emerald-950/10 bg-[radial-gradient(circle_at_top_left,#dcebc7,transparent_45%),#f7f6ef]">
                <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-14 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                    {profile.avatarUrl ? (
                        <Image src={profile.avatarUrl} alt={profile.displayName} width={112} height={112} className="size-28 rounded-full border-4 border-white object-cover shadow-lg" unoptimized />
                    ) : (
                        <div className="flex size-28 shrink-0 items-center justify-center rounded-full border-4 border-white bg-emerald-800 text-4xl font-black text-white shadow-lg">
                            {profile.displayName.charAt(0)}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Perfil público</p>
                        <h1 className="mt-2 text-4xl font-black tracking-tight text-stone-950">{profile.displayName}</h1>
                        <div className="mt-3">
                            {profile.ratingAverage !== null ? (
                                <StarRating value={profile.ratingAverage} showValue reviewCount={profile.ratingCount} />
                            ) : (
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500"><Star className="size-4" /> Sin calificaciones todavía</span>
                            )}
                        </div>
                        {profile.bio && <p className="mt-3 max-w-2xl leading-7 text-stone-600">{profile.bio}</p>}
                        <p className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                            <CalendarDays className="size-4" /> En Agroalva desde {formatShortDate(profile.createdAt)}
                        </p>
                    </div>
                    {!isOwnProfile && (
                        <div className="flex w-full flex-col gap-3 sm:w-auto">
                            <Button type="button" onClick={openConversation} disabled={isOpeningChat} className="h-11 rounded-full bg-emerald-800 px-6 hover:bg-emerald-900">
                                <MessageCircle className="size-4" /> {isOpeningChat ? "Abriendo..." : "Enviar mensaje"}
                            </Button>
                            <Button asChild variant="outline" className="h-11 rounded-full border-emerald-800/30 bg-white px-6 text-emerald-900">
                                <Link href={`/review/${userId}`}><Star className="size-4" /> {myReview ? "Editar mi reseña" : "Calificar usuario"}</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:px-8">
                <section>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">Reputación</p>
                            <h2 className="mt-2 text-3xl font-black text-stone-950">Reseñas</h2>
                        </div>
                        <span className="text-sm font-semibold text-stone-500">{profile.ratingCount} en total</span>
                    </div>
                    <div className="mt-6 space-y-4">
                        {reviews.map((review) => (
                            <article key={review._id} className="rounded-[1.5rem] border border-emerald-950/10 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-800">
                                            {review.reviewer.displayName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <Link href={`/profile/${review.reviewer.userId}`} className="truncate font-black text-stone-900 hover:text-emerald-800">{review.reviewer.displayName}</Link>
                                            <p className="text-xs text-stone-500">{formatShortDate(review.createdAt)}</p>
                                        </div>
                                    </div>
                                    <StarRating value={review.rating} size="sm" />
                                </div>
                                <p className="mt-4 whitespace-pre-wrap leading-7 text-stone-700">{review.comment}</p>
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800">
                                        <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> Interacción verificada</span>
                                        {review.productName && <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">{review.productName}</span>}
                                    </div>
                                    {review.reviewer.userId === user?.id ? (
                                        <Link href={`/review/${userId}`} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"><Pencil className="size-3.5" /> Editar</Link>
                                    ) : (
                                        <button type="button" onClick={() => report(review._id)} disabled={reportedReviewIds.has(review._id)} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-red-700 disabled:text-emerald-700">
                                            <Flag className="size-3.5" /> {reportedReviewIds.has(review._id) ? "Reportada" : "Reportar"}
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                        {reviewStatus === "LoadingFirstPage" && <div className="h-40 animate-pulse rounded-3xl bg-stone-100" />}
                        {reviewStatus !== "LoadingFirstPage" && reviews.length === 0 && (
                            <p className="rounded-3xl border border-dashed bg-white p-9 text-center leading-7 text-stone-600">Este usuario todavía no recibió reseñas.</p>
                        )}
                        {reviewStatus === "CanLoadMore" && (
                            <Button type="button" variant="outline" onClick={() => loadMore(5)} className="w-full rounded-full">Ver más reseñas</Button>
                        )}
                        {reviewStatus === "LoadingMore" && <p className="text-center text-sm text-stone-500">Cargando más reseñas...</p>}
                    </div>
                    {actionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{actionError}</p>}
                </section>

                <section>
                    <h2 className="text-3xl font-black text-stone-950">Publicaciones</h2>
                    {profile.listings.length ? (
                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            {(profile.listings as MarketplaceListing[]).map((product) => <ProductCard key={product._id} product={product} />)}
                        </div>
                    ) : (
                        <p className="mt-7 rounded-3xl border border-dashed bg-white p-12 text-center text-stone-600">Este usuario no tiene publicaciones activas.</p>
                    )}
                </section>
            </div>
        </main>
    );
}

function getErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "data" in error && typeof error.data === "string") return error.data;
    return error instanceof Error ? error.message : "No se pudo completar la acción";
}
