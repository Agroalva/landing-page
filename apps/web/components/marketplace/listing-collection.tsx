"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { PackageOpen } from "lucide-react";
import { api } from "@/lib/convex-api";
import type { MarketplaceListing } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { ListingStatusControls } from "./listing-status-controls";
import { getListingStatus, isClosedStatus } from "../../../app/config/listing-status";

type MineFilter = "all" | "active" | "paused" | "closed";

const MINE_FILTERS: { id: MineFilter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "active", label: "Activas" },
    { id: "paused", label: "Pausadas" },
    { id: "closed", label: "Vendidas / alquiladas" },
];

const matchesFilter = (listing: MarketplaceListing, filter: MineFilter) => {
    if (filter === "all") return true;
    if (filter === "closed") return isClosedStatus(listing.status);
    return getListingStatus(listing.status) === filter;
};

export function ListingCollection({ kind }: { kind: "mine" | "favorites" }) {
    const mine = useQuery(api.marketplace.myListings, kind === "mine" ? {} : "skip");
    const favorites = useQuery(api.marketplace.favoriteListings, kind === "favorites" ? {} : "skip");
    const listings = (kind === "mine" ? mine : favorites) as MarketplaceListing[] | undefined;
    const [filter, setFilter] = useState<MineFilter>("all");
    const visibleListings = useMemo(() => listings?.filter((listing) => matchesFilter(listing, filter)), [listings, filter]);

    if (!listings || !visibleListings) return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-stone-100" />)}</div>;
    if (!listings.length) return <div className="rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center"><PackageOpen className="mx-auto size-10 text-emerald-700" /><h2 className="mt-4 text-2xl font-black">{kind === "mine" ? "Todavía no publicaste" : "Todavía no guardaste favoritos"}</h2><p className="mt-2 text-stone-600">{kind === "mine" ? "Creá tu primera publicación y empezá a conectar." : "Guardá publicaciones para encontrarlas fácilmente."}</p></div>;

    if (kind === "favorites") {
        return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((listing) => <ProductCard key={listing._id} product={listing} />)}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar publicaciones por estado">
                {MINE_FILTERS.map((option) => {
                    const count = listings.filter((listing) => matchesFilter(listing, option.id)).length;
                    const selected = filter === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setFilter(option.id)}
                            className={cn(
                                "rounded-full border px-4 py-2 text-sm font-bold transition",
                                selected ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-emerald-800/40",
                            )}
                        >
                            {option.label} ({count})
                        </button>
                    );
                })}
            </div>
            {visibleListings.length === 0 ? (
                <p className="rounded-[2rem] border border-dashed bg-white px-6 py-12 text-center font-semibold text-stone-600">No hay publicaciones con este estado.</p>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleListings.map((listing) => (
                        <div key={listing._id} className="flex flex-col gap-3">
                            <ProductCard product={listing} />
                            <ListingStatusControls productId={listing._id} type={listing.type} status={listing.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
