"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bell, BellOff, Bookmark, Search, Trash2 } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { formatShortDate } from "@/lib/marketplace";
import { savedSearchToHref } from "@/lib/saved-searches";
import { Button } from "@/components/ui/button";

export function SavedSearchList() {
    const searches = useQuery(api.savedSearches.list, {});
    const setAlertsEnabled = useMutation(api.savedSearches.setAlertsEnabled);
    const remove = useMutation(api.savedSearches.remove);
    const [busyId, setBusyId] = useState<Id<"savedSearches"> | null>(null);

    if (!searches) {
        return <div className="h-64 animate-pulse rounded-3xl bg-stone-100" />;
    }

    if (searches.length === 0) {
        return (
            <div className="rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center">
                <Bookmark className="mx-auto size-10 text-emerald-700" />
                <h2 className="mt-4 text-2xl font-black">Todavía no guardaste búsquedas</h2>
                <p className="mx-auto mt-2 max-w-md text-stone-600">Buscá lo que necesitás, aplicá filtros y tocá “Guardar búsqueda”. Te avisamos cuando se publique algo que coincida.</p>
                <Button asChild className="mt-6 rounded-full bg-emerald-800 px-6"><Link href="/#catalogo"><Search className="size-4" /> Ir al catálogo</Link></Button>
            </div>
        );
    }

    const run = async (id: Id<"savedSearches">, action: () => Promise<unknown>) => {
        setBusyId(id);
        try {
            await action();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="overflow-hidden rounded-[2rem] border bg-white">
            {searches.map((search) => (
                <div key={search._id} className="flex flex-col gap-4 border-b p-5 last:border-0 sm:flex-row sm:items-center">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                        {search.alertsEnabled ? <Bell className="size-5" /> : <BellOff className="size-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link href={savedSearchToHref(search)} className="font-black text-stone-950 hover:underline">{search.label}</Link>
                        <p className="mt-1 text-sm text-stone-500">
                            {search.alertsEnabled ? "Alertas activas" : "Alertas pausadas"} · Guardada el {formatShortDate(search.createdAt)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-full"><Link href={savedSearchToHref(search)}>Ver resultados</Link></Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            disabled={busyId === search._id}
                            onClick={() => void run(search._id, () => setAlertsEnabled({ savedSearchId: search._id, enabled: !search.alertsEnabled }))}
                        >
                            {search.alertsEnabled ? "Pausar alertas" : "Activar alertas"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-red-700 hover:bg-red-50 hover:text-red-800"
                            aria-label="Eliminar búsqueda"
                            disabled={busyId === search._id}
                            onClick={() => {
                                if (window.confirm("¿Eliminar esta búsqueda guardada?")) {
                                    void run(search._id, () => remove({ savedSearchId: search._id }));
                                }
                            }}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
