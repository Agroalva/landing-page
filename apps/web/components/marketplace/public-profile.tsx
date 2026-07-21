"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { CalendarDays, UserRound } from "lucide-react";
import { api } from "@/lib/convex-api";
import type { MarketplaceListing } from "@/lib/marketplace";
import { formatShortDate } from "@/lib/marketplace";
import { ProductCard } from "./product-card";

export function PublicProfile({ userId }: { userId: string }) {
    const profile = useQuery(api.marketplace.getPublicProfile, { userId });
    if (profile === undefined) return <div className="mx-auto my-20 h-96 max-w-7xl animate-pulse rounded-3xl bg-stone-100" />;
    if (profile === null) return <main className="mx-auto min-h-[70vh] max-w-xl px-6 py-20 text-center"><UserRound className="mx-auto size-12 text-stone-400" /><h1 className="mt-5 text-3xl font-black">Perfil no disponible</h1></main>;
    return <main className="min-h-screen"><section className="border-b bg-[radial-gradient(circle_at_top_left,#dcebc7,transparent_45%),#f7f6ef]"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6 lg:px-8">{profile.avatarUrl ? <Image src={profile.avatarUrl} alt={profile.displayName} width={112} height={112} className="size-28 rounded-full border-4 border-white object-cover shadow-lg" unoptimized /> : <div className="flex size-28 items-center justify-center rounded-full border-4 border-white bg-emerald-800 text-4xl font-black text-white shadow-lg">{profile.displayName.charAt(0)}</div>}<div><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Perfil público</p><h1 className="mt-2 text-4xl font-black tracking-tight">{profile.displayName}</h1>{profile.bio && <p className="mt-3 max-w-2xl leading-7 text-stone-600">{profile.bio}</p>}<p className="mt-4 flex items-center gap-2 text-sm text-stone-500"><CalendarDays className="size-4" /> En Agroalva desde {formatShortDate(profile.createdAt)}</p></div></div></section><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h2 className="mb-7 text-3xl font-black">Publicaciones</h2>{profile.listings.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{(profile.listings as MarketplaceListing[]).map((product) => <ProductCard key={product._id} product={product} />)}</div> : <p className="rounded-3xl border border-dashed bg-white p-12 text-center text-stone-600">Este usuario no tiene publicaciones activas.</p>}</section></main>;
}
