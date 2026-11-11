"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { BarChart3, ChevronRight, Eye, Heart, LockKeyhole, MessageCircle, MessageSquareText, Phone } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type ListingStatsSummary = {
    views: number;
    favorites: number;
    contacts: { whatsapp: number; call: number; message: number; total: number };
};

type StatsMetric = "views" | "contacts" | "favorites";

const METRIC_LABELS: Record<StatsMetric, string> = {
    views: "Visitas",
    contacts: "Contactos",
    favorites: "Favoritos",
};

const STATS_COLORS = {
    views: "#2e7d32",
    favorites: "#e53935",
    whatsapp: "#25d366",
    call: "#1565c0",
    message: "#f9a825",
};

const formatNumber = (value: number) => value.toLocaleString("es-AR");

const formatDay = (day: string) => {
    const [, month, date] = day.split("-");
    return `${Number(date)}/${Number(month)}`;
};

function statItems(stats: ListingStatsSummary) {
    return [
        { key: "views", label: "Visitas", value: stats.views, icon: Eye, color: STATS_COLORS.views },
        { key: "favorites", label: "Favoritos", value: stats.favorites, icon: Heart, color: STATS_COLORS.favorites },
        { key: "whatsapp", label: "WhatsApp", value: stats.contacts.whatsapp, icon: MessageCircle, color: STATS_COLORS.whatsapp },
        { key: "call", label: "Llamadas", value: stats.contacts.call, icon: Phone, color: STATS_COLORS.call },
        { key: "message", label: "Mensajes", value: stats.contacts.message, icon: MessageSquareText, color: STATS_COLORS.message },
    ];
}

/** Compact stats row for a card in "Mis publicaciones". */
export function ListingStatsStrip({ productId, stats }: { productId: string; stats?: ListingStatsSummary }) {
    return (
        <div className="border-t border-stone-100 bg-stone-50/70 px-5 py-4">
            {stats ? (
                <ul className="flex items-center justify-between gap-2 text-sm font-semibold text-stone-700">
                    {statItems(stats).map(({ key, label, value, icon: Icon, color }) => (
                        <li key={key} className="flex items-center gap-1" title={label} aria-label={`${label}: ${value}`}>
                            <Icon className="size-4" style={{ color }} aria-hidden />
                            {formatNumber(value)}
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="h-5 animate-pulse rounded bg-stone-200/70" />
            )}
            <Link href={`/my-listings/${productId}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:underline">
                <BarChart3 className="size-4" /> Ver estadísticas <ChevronRight className="size-4" />
            </Link>
        </div>
    );
}

function StatsTiles({ stats }: { stats: ListingStatsSummary }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {statItems(stats).map(({ key, label, value, icon: Icon, color }) => (
                <div key={key} className="rounded-2xl border border-stone-100 bg-white px-4 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                        <Icon className="size-3.5" style={{ color }} aria-hidden /> {label}
                    </p>
                    <p className="mt-1 text-2xl font-black text-stone-950">{formatNumber(value)}</p>
                </div>
            ))}
        </div>
    );
}

/** Private stats box on the product page, rendered only for the author. */
export function ProductOwnerStats({ productId, authorId }: { productId: string; authorId: string }) {
    const { user } = useAuthSession();
    const isOwner = user?.id === authorId;
    const stats = useQuery(
        api.productStats.getProductStats,
        isOwner ? { productId: productId as Id<"products">, days: 30 } : "skip",
    );

    if (!isOwner || !stats) return null;

    return (
        <div className="rounded-[2rem] border border-emerald-950/10 bg-white p-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                <BarChart3 className="size-4" /> Estadísticas
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {statItems(stats.totals).map(({ key, label, value, icon: Icon, color }) => (
                    <div key={key} className="rounded-2xl bg-stone-50 px-3 py-2">
                        <dt className="flex items-center gap-1.5 text-xs font-bold text-stone-500"><Icon className="size-3.5" style={{ color }} aria-hidden /> {label}</dt>
                        <dd className="mt-0.5 text-xl font-black text-stone-950">{formatNumber(value)}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-4 text-sm text-stone-600">
                Últimos {stats.period.days} días: {formatNumber(stats.period.views)} {stats.period.views === 1 ? "visita" : "visitas"} · {formatNumber(stats.period.contacts.total)} {stats.period.contacts.total === 1 ? "contacto" : "contactos"}
            </p>
            <Link href={`/my-listings/${productId}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:underline">
                Ver evolución <ChevronRight className="size-4" />
            </Link>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500"><LockKeyhole className="size-3.5" /> Solo vos podés ver estas estadísticas.</p>
        </div>
    );
}

/** Counts one visit per page load, skipping the author (also enforced by the backend). */
export function ProductViewTracker({ productId, authorId }: { productId: string; authorId: string }) {
    const { user, isLoading } = useAuthSession();
    const incrementViewCount = useMutation(api.products.incrementViewCount);
    const trackedRef = useRef<string | null>(null);
    const isOwner = user?.id === authorId;

    useEffect(() => {
        if (isLoading || isOwner || trackedRef.current === productId) return;
        trackedRef.current = productId;
        incrementViewCount({ productId: productId as Id<"products"> }).catch((error) => {
            console.error("No se pudo registrar la visita:", error);
        });
    }, [productId, isLoading, isOwner, incrementViewCount]);

    return null;
}

const viewsChartConfig = { views: { label: "Visitas", color: STATS_COLORS.views } } satisfies ChartConfig;
const favoritesChartConfig = { favorites: { label: "Nuevos favoritos", color: STATS_COLORS.favorites } } satisfies ChartConfig;
const contactsChartConfig = {
    whatsapp: { label: "WhatsApp", color: STATS_COLORS.whatsapp },
    call: { label: "Llamadas", color: STATS_COLORS.call },
    message: { label: "Mensajes", color: STATS_COLORS.message },
} satisfies ChartConfig;

/** Full stats view for one listing: totals and last-30-days evolution. */
export function ProductStatsDashboard({ productId }: { productId: string }) {
    const [metric, setMetric] = useState<StatsMetric>("views");
    const stats = useQuery(api.productStats.getProductStats, { productId: productId as Id<"products">, days: 30 });

    if (stats === undefined) {
        return <div className="h-96 animate-pulse rounded-[2rem] bg-stone-100" />;
    }

    if (stats === null) {
        return (
            <div className="rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center">
                <LockKeyhole className="mx-auto size-10 text-emerald-700" />
                <h2 className="mt-4 text-2xl font-black">Estadísticas no disponibles</h2>
                <p className="mt-2 text-stone-600">Solo el autor de la publicación puede ver sus estadísticas.</p>
            </div>
        );
    }

    const data = stats.daily.map((point) => ({ ...point, label: formatDay(point.day) }));
    const periodTotal = metric === "contacts" ? stats.period.contacts.total : stats.period[metric];

    return (
        <div className="space-y-8">
            <div>
                <Link href={`/product/${stats.productId}`} className="text-3xl font-black tracking-tight text-stone-950 hover:text-emerald-800">{stats.name}</Link>
                <p className="mt-1 text-sm text-stone-500">Publicado el {new Date(stats.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>

            <section>
                <h2 className="mb-3 text-lg font-black text-stone-950">Totales</h2>
                <StatsTiles stats={stats.totals} />
            </section>

            <section className="rounded-[2rem] border border-emerald-950/10 bg-white p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-stone-950">Últimos {stats.period.days} días</h2>
                        <p className="mt-1 text-3xl font-black text-stone-950">{formatNumber(periodTotal)} <span className="text-base font-medium text-stone-500">{METRIC_LABELS[metric].toLowerCase()} en el período</span></p>
                    </div>
                    <div className="inline-flex rounded-full bg-stone-100 p-1" role="tablist" aria-label="Métrica">
                        {(Object.keys(METRIC_LABELS) as StatsMetric[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                role="tab"
                                aria-selected={metric === item}
                                onClick={() => setMetric(item)}
                                className={cn("rounded-full px-4 py-1.5 text-sm font-bold transition", metric === item ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500 hover:text-stone-800")}
                            >
                                {METRIC_LABELS[item]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    {metric === "contacts" ? (
                        <ChartContainer config={contactsChartConfig} className="aspect-auto h-72 w-full">
                            <BarChart data={data} margin={{ left: -20, right: 4 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="whatsapp" stackId="contacts" fill="var(--color-whatsapp)" />
                                <Bar dataKey="call" stackId="contacts" fill="var(--color-call)" />
                                <Bar dataKey="message" stackId="contacts" fill="var(--color-message)" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <ChartContainer config={metric === "views" ? viewsChartConfig : favoritesChartConfig} className="aspect-auto h-72 w-full">
                            <BarChart data={data} margin={{ left: -20, right: 4 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </div>

                {metric === "contacts" && (
                    <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                        {[
                            { label: "WhatsApp", value: stats.period.contacts.whatsapp, color: STATS_COLORS.whatsapp },
                            { label: "Llamadas", value: stats.period.contacts.call, color: STATS_COLORS.call },
                            { label: "Mensajes", value: stats.period.contacts.message, color: STATS_COLORS.message },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
                                <dt className="flex items-center gap-2 text-sm font-semibold text-stone-600"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</dt>
                                <dd className="text-lg font-black text-stone-950">{formatNumber(item.value)}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </section>

            <p className="text-sm leading-6 text-stone-500">
                Las estadísticas son privadas: solo vos podés verlas. No se cuentan tus propias visitas ni contactos, y los contactos repetidos de una misma persona en poco tiempo se cuentan una sola vez. El detalle diario de visitas y contactos se registra desde la última actualización de Agroalva; los favoritos muestran los que siguen guardados.
            </p>
        </div>
    );
}
