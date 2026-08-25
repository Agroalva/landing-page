"use client";

import { useEffect, useRef, useState } from "react";
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
    Search,
} from "lucide-react";

export type WeatherLocation = {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
};

type LocationSearchResponse = {
    items: WeatherLocation[];
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
};

const PAGE_SIZE = 5;

async function searchLocations(query: string, page: number, signal: AbortSignal) {
    const searchParams = new URLSearchParams({
        catalog: "georef-v1",
        q: query,
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
    });
    const response = await fetch(`/api/weather/locations?${searchParams}`, { signal });
    const data = (await response.json().catch(() => null)) as LocationSearchResponse | { error?: string } | null;

    if (!response.ok || !data || !("items" in data)) {
        throw new Error(
            data && "error" in data && data.error
                ? data.error
                : "No pudimos buscar ubicaciones.",
        );
    }

    return data;
}

export function WeatherLocationPicker({
    value,
    disabled,
    onSelect,
}: {
    value: WeatherLocation | null;
    disabled: boolean;
    onSelect: (location: WeatherLocation) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [searchResult, setSearchResult] = useState<LocationSearchResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const normalizedQuery = query.trim();
    const canSearch = normalizedQuery.length !== 1;

    useEffect(() => {
        if (!isOpen || !canSearch) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setIsSearching(true);
            setSearchError(null);

            try {
                const result = await searchLocations(normalizedQuery, page, controller.signal);
                setSearchResult(result);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setSearchResult(null);
                    setSearchError(error instanceof Error ? error.message : "No pudimos buscar ubicaciones.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [canSearch, isOpen, normalizedQuery, page]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handlePointerDown(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const items = searchResult?.items ?? [];
    const total = searchResult?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const hasNextPage = Boolean(searchResult?.hasNextPage);

    function chooseLocation(location: WeatherLocation) {
        onSelect(location);
        setIsOpen(false);
        setQuery("");
        setPage(1);
        setSearchResult(null);
        setSearchError(null);
        setIsSearching(false);
    }

    function changePage(nextPage: number) {
        setIsSearching(true);
        setPage(nextPage);
    }

    return (
        <div ref={containerRef} className="relative min-w-0 flex-1">
            <button
                type="button"
                aria-label="Seleccionar ubicación del clima"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls="weather-location-options"
                onClick={() => setIsOpen((open) => {
                    if (!open && canSearch) {
                        setIsSearching(true);
                    }

                    return !open;
                })}
                disabled={disabled}
                className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-emerald-950/10 bg-white/45 py-1 pl-2 pr-2 text-left text-xs font-bold text-emerald-950 outline-none transition hover:bg-white/65 focus-visible:border-emerald-800 disabled:cursor-wait disabled:opacity-65"
            >
                <span className="truncate">{value?.label ?? "Elegir ubicación"}</span>
                <ChevronDown className={`size-3.5 shrink-0 text-emerald-950/55 transition ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen ? (
                <div className="absolute left-0 top-10 z-40 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-emerald-950/10 bg-[#f8f5ec] p-2 shadow-[0_18px_45px_rgba(2,25,13,0.2)]">
                    <label className="relative block">
                        <span className="sr-only">Buscar ciudad o localidad</span>
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-emerald-950/45" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => {
                                const nextQuery = event.target.value;
                                setQuery(nextQuery);
                                setPage(1);
                                setSearchResult(null);
                                setSearchError(null);
                                setIsSearching(nextQuery.trim().length >= 2);
                            }}
                            placeholder="Buscar ciudad o localidad…"
                            autoComplete="off"
                            className="h-9 w-full rounded-lg border border-emerald-950/10 bg-white pl-8 pr-3 text-xs font-semibold text-emerald-950 outline-none placeholder:text-emerald-950/35 focus:border-emerald-700"
                        />
                    </label>

                    <div className="mt-2 flex items-center justify-between px-1 text-[0.62rem] font-black uppercase tracking-[0.1em] text-emerald-950/45">
                        <span>{normalizedQuery ? "Resultados" : "Todas las localidades"}</span>
                        {isSearching ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
                    </div>

                    <div id="weather-location-options" role="listbox" aria-label="Ubicaciones" className="mt-1 min-h-40 space-y-1">
                        {normalizedQuery.length === 1 ? (
                            <p className="px-2 py-3 text-xs font-semibold text-emerald-950/55">Escribí al menos 2 letras para buscar.</p>
                        ) : null}
                        {searchError ? (
                            <p className="px-2 py-3 text-xs font-semibold text-red-700">{searchError}</p>
                        ) : null}
                        {!isSearching && !searchError && canSearch && searchResult !== null && items.length === 0 ? (
                            <p className="px-2 py-3 text-xs font-semibold text-emerald-950/55">No encontramos localidades argentinas.</p>
                        ) : null}
                        {!searchError && !(normalizedQuery.length === 1) ? items.map((location) => (
                            <button
                                key={location.id}
                                type="button"
                                role="option"
                                aria-selected={value?.id === location.id}
                                onClick={() => chooseLocation(location)}
                                className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-emerald-950 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-800"
                            >
                                <span className="truncate">{location.label}</span>
                                {value?.id === location.id ? <Check className="size-3.5 shrink-0" /> : null}
                            </button>
                        )) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-emerald-950/10 pt-2">
                        <button
                            type="button"
                            onClick={() => changePage(Math.max(1, page - 1))}
                            disabled={page === 1 || isSearching}
                            aria-label="Página anterior de ubicaciones"
                            className="flex size-7 items-center justify-center rounded-lg text-emerald-950 transition hover:bg-emerald-100 disabled:opacity-30"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-[0.65rem] font-bold text-emerald-950/55">
                            Página {page} de {totalPages}{total ? ` · ${total.toLocaleString("es-AR")}` : ""}
                        </span>
                        <button
                            type="button"
                            onClick={() => changePage(page + 1)}
                            disabled={!hasNextPage || isSearching}
                            aria-label="Página siguiente de ubicaciones"
                            className="flex size-7 items-center justify-center rounded-lg text-emerald-950 transition hover:bg-emerald-100 disabled:opacity-30"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
