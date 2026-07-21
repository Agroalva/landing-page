"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/convex-api";
import type { MarketplaceListing } from "@/lib/marketplace";
import { getFamilies, getFamilyById } from "../../../app/config/taxonomy";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FAMILIES = getFamilies();

export function MarketplaceBrowser({ compact = false }: { compact?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [draftSearch, setDraftSearch] = useState(searchParams.get("q") || "");
    const query = searchParams.get("q") || undefined;
    const familyId = searchParams.get("family") || undefined;
    const categoryId = searchParams.get("category") || undefined;
    const typeParam = searchParams.get("type");
    const listingType = typeParam === "sell" || typeParam === "rent" ? typeParam : undefined;
    const categories = familyId ? getFamilyById(familyId)?.categories || [] : [];

    const { results, status, loadMore } = usePaginatedQuery(
        api.marketplace.list,
        { search: query, familyId, categoryId, listingType },
        { initialNumItems: compact ? 8 : 12 },
    );

    const setParams = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(searchParams.toString());
        Object.entries(changes).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
        });
        router.replace(`${compact ? "/marketplace" : location.pathname}${next.size ? `?${next}` : ""}`);
    };

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        setParams({ q: draftSearch.trim() || undefined });
    };

    return (
        <div>
            {!compact && (
                <div className="mb-8 rounded-[2rem] border border-emerald-950/10 bg-white p-4 shadow-[0_16px_50px_rgba(32,58,41,0.07)] md:p-6">
                    <form onSubmit={submitSearch} className="flex flex-col gap-3 lg:flex-row">
                        <label className="relative flex-1">
                            <span className="sr-only">Buscar publicaciones</span>
                            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
                            <Input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Buscar tractores, semillas, servicios..." className="h-12 rounded-full pl-12 text-base" />
                        </label>
                        <Button type="submit" className="h-12 rounded-full bg-emerald-800 px-7">Buscar</Button>
                    </form>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <label className="filter-field">
                            <span><Filter className="size-3.5" /> Familia</span>
                            <select value={familyId || ""} onChange={(event) => setParams({ family: event.target.value || undefined, category: undefined })}>
                                <option value="">Todas</option>
                                {FAMILIES.map((family) => <option key={family.id} value={family.id}>{family.label}</option>)}
                            </select>
                        </label>
                        <label className="filter-field">
                            <span><SlidersHorizontal className="size-3.5" /> Categoría</span>
                            <select value={categoryId || ""} disabled={!familyId} onChange={(event) => setParams({ category: event.target.value || undefined })}>
                                <option value="">Todas</option>
                                {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                            </select>
                        </label>
                        <label className="filter-field">
                            <span>Tipo de publicación</span>
                            <select value={listingType || ""} onChange={(event) => setParams({ type: event.target.value || undefined })}>
                                <option value="">Venta y alquiler</option>
                                <option value="sell">Venta</option>
                                <option value="rent">Alquiler / servicio</option>
                            </select>
                        </label>
                    </div>
                    {(query || familyId || categoryId || listingType) && (
                        <button type="button" onClick={() => { setDraftSearch(""); router.replace("/marketplace"); }} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline">
                            <X className="size-4" /> Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            {status === "LoadingFirstPage" ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: compact ? 4 : 8 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-[1.6rem] bg-stone-100" />)}
                </div>
            ) : results.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-emerald-900/25 bg-emerald-50/40 px-6 py-16 text-center">
                    <Search className="mx-auto size-10 text-emerald-700" />
                    <h2 className="mt-5 text-2xl font-bold text-stone-950">No encontramos publicaciones</h2>
                    <p className="mx-auto mt-2 max-w-md text-stone-600">Probá con otra búsqueda o quitá algunos filtros.</p>
                </div>
            ) : (
                <>
                    <div className={`grid gap-5 sm:grid-cols-2 ${compact ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
                        {(results as MarketplaceListing[]).map((product) => <ProductCard key={product._id} product={product} />)}
                    </div>
                    {!compact && status !== "Exhausted" && (
                        <div className="mt-10 text-center">
                            <Button variant="outline" className="rounded-full px-8" disabled={status === "LoadingMore"} onClick={() => loadMore(12)}>
                                {status === "LoadingMore" ? "Cargando..." : "Ver más publicaciones"}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
