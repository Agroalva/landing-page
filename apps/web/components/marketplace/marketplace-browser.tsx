"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Boxes,
    Filter,
    PackageOpen,
    Search,
    SlidersHorizontal,
    UsersRound,
    Wrench,
    X,
} from "lucide-react";
import { api } from "@/lib/convex-api";
import type { MarketplaceListing } from "@/lib/marketplace";
import { getFamilies, getFamilyById } from "../../../app/config/taxonomy";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FAMILIES = getFamilies();
const PERSONAL_FAMILY_ID = "personal";
const PERSONAL_CATEGORY_ID = "personal_services";

type MarketplaceView = "all" | "products" | "services" | "personnel";

const VIEW_OPTIONS: Array<{
    id: MarketplaceView;
    label: string;
    icon: typeof Boxes;
}> = [
    { id: "all", label: "Todo", icon: Boxes },
    { id: "products", label: "Productos", icon: PackageOpen },
    { id: "services", label: "Servicios", icon: Wrench },
    { id: "personnel", label: "Personal", icon: UsersRound },
];

export function MarketplaceBrowser() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get("q") || "";
    const [searchDraft, setSearchDraft] = useState({ value: currentQuery, sourceQuery: currentQuery });
    const draftSearch = searchDraft.sourceQuery === currentQuery ? searchDraft.value : currentQuery;
    const query = currentQuery || undefined;
    const familyId = searchParams.get("family") || undefined;
    const categoryId = searchParams.get("category") || undefined;
    const typeParam = searchParams.get("type");
    const listingType = typeParam === "sell" || typeParam === "rent" ? typeParam : undefined;
    const categories = familyId ? getFamilyById(familyId)?.categories || [] : [];
    const activeView: MarketplaceView = familyId === PERSONAL_FAMILY_ID
        ? "personnel"
        : listingType === "sell"
            ? "products"
            : listingType === "rent"
                ? "services"
                : "all";
    const availableFamilies = listingType === "sell"
        ? FAMILIES.filter((family) => family.id !== PERSONAL_FAMILY_ID)
        : FAMILIES;

    const { results, status, loadMore } = usePaginatedQuery(
        api.marketplace.list,
        { search: query, familyId, categoryId, listingType },
        { initialNumItems: 12 },
    );

    const setParams = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(searchParams.toString());
        Object.entries(changes).forEach(([key, value]) => {
            if (value) {
                next.set(key, value);
            } else {
                next.delete(key);
            }
        });
        router.replace(`${pathname}${next.size ? `?${next}` : ""}#catalogo`, { scroll: false });
    };

    const selectView = (view: MarketplaceView) => {
        if (view === "products") {
            setParams({ type: "sell", family: undefined, category: undefined });
            return;
        }
        if (view === "services") {
            setParams({ type: "rent", family: undefined, category: undefined });
            return;
        }
        if (view === "personnel") {
            setParams({ type: "rent", family: PERSONAL_FAMILY_ID, category: PERSONAL_CATEGORY_ID });
            return;
        }
        setParams({ type: undefined, family: undefined, category: undefined });
    };

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        setParams({ q: draftSearch.trim() || undefined });
    };

    const clearFilters = () => {
        setSearchDraft({ value: "", sourceQuery: currentQuery });
        router.replace(`${pathname}#catalogo`, { scroll: false });
    };

    return (
        <div>
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-[1.4rem] border border-emerald-950/10 bg-white p-2 shadow-[0_12px_40px_rgba(32,58,41,0.05)] md:grid-cols-4">
                {VIEW_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = option.id === activeView;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => selectView(option.id)}
                            aria-pressed={isActive}
                            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${
                                isActive
                                    ? "bg-emerald-950 text-white shadow-sm"
                                    : "text-stone-600 hover:bg-emerald-50 hover:text-emerald-950"
                            }`}
                        >
                            <Icon className="size-4" />
                            {option.label}
                        </button>
                    );
                })}
            </div>

            <div className="mb-8 rounded-[2rem] border border-emerald-950/10 bg-white p-4 shadow-[0_16px_50px_rgba(32,58,41,0.07)] md:p-6">
                <form onSubmit={submitSearch} className="flex flex-col gap-3 lg:flex-row">
                    <label className="relative flex-1">
                        <span className="sr-only">Buscar publicaciones</span>
                        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
                        <Input
                            value={draftSearch}
                            onChange={(event) => setSearchDraft({ value: event.target.value, sourceQuery: currentQuery })}
                            placeholder={activeView === "personnel" ? "Buscar oficio, rol o experiencia..." : "Buscar tractores, semillas, transporte..."}
                            className="h-12 rounded-full pl-12 text-base"
                        />
                    </label>
                    <Button type="submit" className="h-12 rounded-full bg-emerald-800 px-7">Buscar</Button>
                </form>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="filter-field">
                        <span><Filter className="size-3.5" /> Rubro</span>
                        <select value={familyId || ""} onChange={(event) => setParams({ family: event.target.value || undefined, category: undefined })}>
                            <option value="">Todos los rubros</option>
                            {availableFamilies.map((family) => <option key={family.id} value={family.id}>{family.label}</option>)}
                        </select>
                    </label>
                    <label className="filter-field">
                        <span><SlidersHorizontal className="size-3.5" /> Categoría</span>
                        <select value={categoryId || ""} disabled={!familyId} onChange={(event) => setParams({ category: event.target.value || undefined })}>
                            <option value="">Todas las categorías</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                        </select>
                    </label>
                    <label className="filter-field">
                        <span>Modalidad</span>
                        <select
                            value={listingType || ""}
                            onChange={(event) => {
                                const nextType = event.target.value || undefined;
                                const resetPersonal = nextType === "sell" && familyId === PERSONAL_FAMILY_ID;
                                setParams({
                                    type: nextType,
                                    family: resetPersonal ? undefined : familyId,
                                    category: resetPersonal ? undefined : categoryId,
                                });
                            }}
                        >
                            <option value="">Todas</option>
                            <option value="sell">Venta</option>
                            <option value="rent">Alquiler / servicio</option>
                        </select>
                    </label>
                </div>
                {(query || familyId || categoryId || listingType) && (
                    <button type="button" onClick={clearFilters} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline">
                        <X className="size-4" /> Limpiar filtros
                    </button>
                )}
            </div>

            {status === "LoadingFirstPage" ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-[1.6rem] bg-stone-200/70" />)}
                </div>
            ) : results.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-emerald-900/25 bg-emerald-50/40 px-6 py-16 text-center">
                    <Search className="mx-auto size-10 text-emerald-700" />
                    <h2 className="mt-5 text-2xl font-bold text-stone-950">No encontramos publicaciones</h2>
                    <p className="mx-auto mt-2 max-w-md text-stone-600">Probá con otra búsqueda o quitá algunos filtros.</p>
                    <Button type="button" variant="outline" onClick={clearFilters} className="mt-6 rounded-full bg-white px-6">Ver todas las publicaciones</Button>
                </div>
            ) : (
                <>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {(results as MarketplaceListing[]).map((product) => <ProductCard key={product._id} product={product} />)}
                    </div>
                    {status !== "Exhausted" && (
                        <div className="mt-10 text-center">
                            <Button variant="outline" className="rounded-full bg-white px-8" disabled={status === "LoadingMore"} onClick={() => loadMore(12)}>
                                {status === "LoadingMore" ? "Cargando..." : "Ver más publicaciones"}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
