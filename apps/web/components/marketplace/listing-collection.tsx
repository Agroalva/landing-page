"use client";

import { useQuery } from "convex/react";
import { PackageOpen } from "lucide-react";
import { api } from "@/lib/convex-api";
import type { MarketplaceListing } from "@/lib/marketplace";
import { ProductCard } from "./product-card";

export function ListingCollection({ kind }: { kind: "mine" | "favorites" }) {
    const mine = useQuery(api.marketplace.myListings, kind === "mine" ? {} : "skip");
    const favorites = useQuery(api.marketplace.favoriteListings, kind === "favorites" ? {} : "skip");
    const listings = (kind === "mine" ? mine : favorites) as MarketplaceListing[] | undefined;
    if (!listings) return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-stone-100" />)}</div>;
    if (!listings.length) return <div className="rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center"><PackageOpen className="mx-auto size-10 text-emerald-700" /><h2 className="mt-4 text-2xl font-black">{kind === "mine" ? "Todavía no publicaste" : "Todavía no guardaste favoritos"}</h2><p className="mt-2 text-stone-600">{kind === "mine" ? "Creá tu primera publicación y empezá a conectar." : "Guardá publicaciones para encontrarlas fácilmente."}</p></div>;
    return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((listing) => <ProductCard key={listing._id} product={listing} />)}</div>;
}
