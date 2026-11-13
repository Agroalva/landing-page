"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, usePaginatedQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    ArrowDownUp,
    Bookmark,
    Boxes,
    CalendarRange,
    CircleDollarSign,
    Filter,
    LocateFixed,
    PackageOpen,
    Search,
    SlidersHorizontal,
    UsersRound,
    Wrench,
    X,
} from "lucide-react";
import { api } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { getSavedSearchTopLevel } from "@/lib/saved-searches";
import type { MarketplaceListing } from "@/lib/marketplace";
import { getFamilies, getFamilyById } from "../../../app/config/taxonomy";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FAMILIES = getFamilies();
const PERSONAL_FAMILY_ID = "personal";
const PERSONAL_CATEGORY_ID = "personal_services";

type MarketplaceView = "all" | "products" | "services" | "personnel";
type ListingSort = "recent" | "price_asc" | "price_desc" | "distance";
type PriceCurrency = "USD" | "ARS";

const SORT_OPTIONS: Array<{ id: ListingSort; label: string }> = [
    { id: "recent", label: "Más recientes" },
    { id: "distance", label: "Más cerca" },
    { id: "price_asc", label: "Menor precio" },
    { id: "price_desc", label: "Mayor precio" },
];

// Accepts "1.500.000" or "1500000".
function parseIntegerParam(value: string | null) {
    const digits = value?.replace(/[^\d]/g, "") ?? "";
    if (!digits) {
        return undefined;
    }
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : undefined;
}

const RADIUS_OPTIONS_KM = [50, 100, 200];

function parseSort(value: string | null): ListingSort {
    return value === "price_asc" || value === "price_desc" || value === "distance" ? value : "recent";
}

function parseCoordinate(value: string | null, limit: number) {
    if (!value) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : undefined;
}

// ~1 km precision: enough for 50+ km radii and keeps exact coordinates out of URLs.
const roundCoordinate = (value: number) => Math.round(value * 100) / 100;

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
    const radiusKm = parseIntegerParam(searchParams.get("radius"));
    const nearLatitude = parseCoordinate(searchParams.get("lat"), 90);
    const nearLongitude = parseCoordinate(searchParams.get("lng"), 180);
    const near = radiusKm && nearLatitude !== undefined && nearLongitude !== undefined
        ? { latitude: nearLatitude, longitude: nearLongitude, radiusKm }
        : undefined;
    const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "error">("idle");
    const { isAuthenticated } = useAuthSession();
    const createSavedSearch = useMutation(api.savedSearches.create);
    const [saveState, setSaveState] = useState<{ key: string; status: "saving" | "saved" | "already" | "error"; message?: string } | null>(null);
    const requestedSort = parseSort(searchParams.get("sort"));
    const sort: ListingSort = requestedSort === "distance" && !near ? "recent" : requestedSort;
    const priceCurrency: PriceCurrency = searchParams.get("currency") === "ARS" ? "ARS" : "USD";
    const minPrice = parseIntegerParam(searchParams.get("minPrice"));
    const maxPrice = parseIntegerParam(searchParams.get("maxPrice"));
    const minYear = parseIntegerParam(searchParams.get("minYear"));
    const maxYear = parseIntegerParam(searchParams.get("maxYear"));
    const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;
    const hasRangeFilters = hasPriceFilter || minYear !== undefined || maxYear !== undefined;
    const usesDiscover = sort !== "recent" || hasRangeFilters || near !== undefined;
    const rangeKey = searchParams.toString();
    const [rangeDraft, setRangeDraft] = useState({
        sourceKey: rangeKey,
        minPrice: searchParams.get("minPrice") || "",
        maxPrice: searchParams.get("maxPrice") || "",
        minYear: searchParams.get("minYear") || "",
        maxYear: searchParams.get("maxYear") || "",
    });
    const ranges = rangeDraft.sourceKey === rangeKey
        ? rangeDraft
        : {
            sourceKey: rangeKey,
            minPrice: searchParams.get("minPrice") || "",
            maxPrice: searchParams.get("maxPrice") || "",
            minYear: searchParams.get("minYear") || "",
            maxYear: searchParams.get("maxYear") || "",
        };

    const listResults = usePaginatedQuery(
        api.marketplace.list,
        usesDiscover ? "skip" : { search: query, familyId, categoryId, listingType },
        { initialNumItems: 12 },
    );
    const discoverResults = usePaginatedQuery(
        api.marketplace.discover,
        usesDiscover
            ? {
                query,
                familyId,
                categoryId,
                listingType,
                sort,
                priceCurrency: hasPriceFilter ? priceCurrency : undefined,
                minPrice,
                maxPrice,
                minYear,
                maxYear,
                near,
            }
            : "skip",
        { initialNumItems: 12 },
    );
    const { status, loadMore } = usesDiscover ? discoverResults : listResults;
    const rawResults = usesDiscover ? discoverResults.results : listResults.results;
    // discover pages by offset: drop repeats if listings shift between pages.
    const results = useMemo(() => {
        const seen = new Set<string>();
        return (rawResults as MarketplaceListing[]).filter((listing) => {
            if (seen.has(listing._id)) {
                return false;
            }
            seen.add(listing._id);
            return true;
        });
    }, [rawResults]);

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

    const updateRange = (key: "minPrice" | "maxPrice" | "minYear" | "maxYear", value: string) => {
        setRangeDraft({ ...ranges, [key]: value });
    };

    const applyRanges = (event: React.FormEvent) => {
        event.preventDefault();
        const toParam = (value: string) => {
            const parsed = parseIntegerParam(value);
            return parsed === undefined ? undefined : String(parsed);
        };
        setParams({
            minPrice: toParam(ranges.minPrice),
            maxPrice: toParam(ranges.maxPrice),
            minYear: toParam(ranges.minYear),
            maxYear: toParam(ranges.maxYear),
        });
    };

    const selectRadius = (value: string) => {
        const nextRadius = parseIntegerParam(value);
        if (!nextRadius) {
            setParams({
                radius: undefined,
                lat: undefined,
                lng: undefined,
                sort: requestedSort === "distance" ? undefined : searchParams.get("sort") || undefined,
            });
            return;
        }
        const nextSort = sort === "recent" ? "distance" : sort;
        if (nearLatitude !== undefined && nearLongitude !== undefined) {
            setParams({ radius: String(nextRadius), sort: nextSort });
            return;
        }
        if (!navigator.geolocation) {
            setLocationStatus("error");
            return;
        }
        setLocationStatus("locating");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationStatus("idle");
                setParams({
                    radius: String(nextRadius),
                    lat: String(roundCoordinate(position.coords.latitude)),
                    lng: String(roundCoordinate(position.coords.longitude)),
                    sort: nextSort,
                });
            },
            () => setLocationStatus("error"),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
        );
    };

    const clearFilters = () => {
        setSearchDraft({ value: "", sourceQuery: currentQuery });
        router.replace(`${pathname}#catalogo`, { scroll: false });
    };

    const searchKey = searchParams.toString();
    const currentSave = saveState?.key === searchKey ? saveState : null;
    const saveSearch = async () => {
        if (!isAuthenticated) {
            router.push(`/sign-in?redirect=${encodeURIComponent(`${pathname}${searchKey ? `?${searchKey}` : ""}`)}`);
            return;
        }
        setSaveState({ key: searchKey, status: "saving" });
        try {
            const result = await createSavedSearch({
                query,
                familyId,
                categoryId,
                listingType,
                priceCurrency: hasPriceFilter ? priceCurrency : undefined,
                minPrice,
                maxPrice,
                minYear,
                maxYear,
                near,
                topLevel: getSavedSearchTopLevel(activeView),
                sort: sort === "recent" ? undefined : sort,
            });
            setSaveState({ key: searchKey, status: result.alreadySaved ? "already" : "saved" });
        } catch (error) {
            const data = (error as { data?: unknown }).data;
            setSaveState({ key: searchKey, status: "error", message: typeof data === "string" ? data : "No pudimos guardar la búsqueda. Probá de nuevo." });
        }
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
                            placeholder={activeView === "personnel" ? "Buscar oficio, rol o experiencia..." : "Buscar maquinaria, insumos o provincia..."}
                            className="h-12 rounded-full pl-12 text-base"
                        />
                    </label>
                    <Button type="submit" className="h-12 rounded-full bg-emerald-800 px-7">Buscar</Button>
                </form>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    <label className="filter-field">
                        <span><LocateFixed className="size-3.5" /> Distancia</span>
                        <select value={near ? String(near.radiusKm) : ""} disabled={locationStatus === "locating"} onChange={(event) => selectRadius(event.target.value)}>
                            <option value="">{locationStatus === "locating" ? "Buscando tu ubicación..." : "Cualquier distancia"}</option>
                            {RADIUS_OPTIONS_KM.map((radius) => <option key={radius} value={radius}>A menos de {radius} km</option>)}
                        </select>
                    </label>
                </div>
                {locationStatus === "error" && (
                    <p className="mt-3 text-xs font-semibold text-red-700">No pudimos obtener tu ubicación. Revisá el permiso del navegador e intentá de nuevo.</p>
                )}
                {near && (
                    <p className="mt-3 text-xs text-stone-500">Mostrando publicaciones cerca de tu ubicación. Las publicaciones sin ubicación no aparecen con este filtro.</p>
                )}
                <form onSubmit={applyRanges} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1.1fr_auto]">
                    <label className="filter-field">
                        <span><ArrowDownUp className="size-3.5" /> Ordenar</span>
                        <select value={sort} onChange={(event) => setParams({ sort: event.target.value === "recent" ? undefined : event.target.value })}>
                            {SORT_OPTIONS.filter((option) => option.id !== "distance" || near).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                    </label>
                    <div className="filter-field">
                        <span><CircleDollarSign className="size-3.5" /> Precio</span>
                        <div className="flex items-center gap-2">
                            <select aria-label="Moneda del rango de precio" value={priceCurrency} onChange={(event) => setParams({ currency: event.target.value === "USD" ? undefined : event.target.value })}>
                                <option value="USD">US$</option>
                                <option value="ARS">AR$</option>
                            </select>
                            <input inputMode="numeric" aria-label="Precio desde" placeholder="Desde" value={ranges.minPrice} onChange={(event) => updateRange("minPrice", event.target.value)} />
                            <span className="text-stone-400">–</span>
                            <input inputMode="numeric" aria-label="Precio hasta" placeholder="Hasta" value={ranges.maxPrice} onChange={(event) => updateRange("maxPrice", event.target.value)} />
                        </div>
                    </div>
                    <div className="filter-field">
                        <span><CalendarRange className="size-3.5" /> Año</span>
                        <div className="flex items-center gap-2">
                            <input inputMode="numeric" maxLength={4} aria-label="Año desde" placeholder="Desde" value={ranges.minYear} onChange={(event) => updateRange("minYear", event.target.value)} />
                            <span className="text-stone-400">–</span>
                            <input inputMode="numeric" maxLength={4} aria-label="Año hasta" placeholder="Hasta" value={ranges.maxYear} onChange={(event) => updateRange("maxYear", event.target.value)} />
                        </div>
                    </div>
                    <Button type="submit" variant="outline" className="h-auto min-h-12 rounded-2xl px-6">Aplicar</Button>
                </form>
                {(sort !== "recent" || hasPriceFilter) && (
                    <p className="mt-3 text-xs text-stone-500">Pesos y dólares se comparan con la cotización del dólar oficial. Las publicaciones sin precio quedan al final del orden por precio y fuera del filtro.</p>
                )}
                {(query || familyId || categoryId || listingType || usesDiscover) && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline">
                            <X className="size-4" /> Limpiar filtros
                        </button>
                        <button type="button" onClick={() => void saveSearch()} disabled={currentSave?.status === "saving"} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline disabled:opacity-60">
                            <Bookmark className="size-4" /> {currentSave?.status === "saving" ? "Guardando..." : "Guardar búsqueda"}
                        </button>
                        {(currentSave?.status === "saved" || currentSave?.status === "already") && (
                            <p className="text-sm text-stone-600">
                                {currentSave.status === "saved" ? "Búsqueda guardada. Te avisamos cuando se publique algo que coincida." : "Ya tenías guardada esta búsqueda."}{" "}
                                <Link href="/saved-searches" className="font-semibold text-emerald-800 hover:underline">Ver mis búsquedas</Link>
                            </p>
                        )}
                        {currentSave?.status === "error" && <p className="text-sm font-semibold text-red-700">{currentSave.message}</p>}
                    </div>
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
                        {results.map((product) => <ProductCard key={product._id} product={product} />)}
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
