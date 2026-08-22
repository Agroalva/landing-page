import {
    CircleDollarSign,
    CloudSun,
    Droplets,
    MapPin,
    Truck,
    Wheat,
    Wind,
} from "lucide-react";

const GRAIN_PRICES = [
    { label: "Soja", value: "$ 312.500" },
    { label: "Maíz", value: "$ 178.200" },
    { label: "Trigo", value: "$ 224.800" },
];

const FREIGHT_RATES = [
    { label: "100 km", value: "$ 18.450" },
    { label: "300 km", value: "$ 34.900" },
    { label: "500 km", value: "$ 49.800" },
];

const DOLLAR_RATES = [
    { label: "Oficial", value: "$ 1.480" },
    { label: "Mayorista", value: "$ 1.455" },
    { label: "MEP", value: "$ 1.492" },
    { label: "CCL", value: "$ 1.506" },
    { label: "Blue", value: "$ 1.515" },
    { label: "Tarjeta", value: "$ 1.924" },
];

function MetricList({ items, suffix }: { items: Array<{ label: string; value: string }>; suffix?: string }) {
    return (
        <dl className="mt-4 space-y-2.5">
            {items.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-3 border-t border-stone-900/8 pt-2.5 first:border-0 first:pt-0">
                    <dt className="text-sm font-medium text-stone-600">{item.label}</dt>
                    <dd className="text-right text-sm font-black text-stone-950">
                        {item.value}
                        {suffix ? <span className="ml-1 text-[0.65rem] font-bold text-stone-400">{suffix}</span> : null}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function MarketPulse() {
    return (
        <aside
            aria-label="Información útil del campo, datos de muestra"
            className="mt-10 w-full max-w-xl rounded-[2rem] border border-white/25 bg-[#f8f5ec]/95 p-4 text-stone-950 shadow-[0_28px_80px_rgba(2,25,13,0.28)] backdrop-blur-md lg:mt-0 lg:justify-self-end"
        >
            <div className="flex items-center justify-between gap-4 px-1 pb-4">
                <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-700">Información útil</p>
                    <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Pulso del campo</h2>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.12em] text-amber-900">
                    Datos de muestra
                </span>
            </div>

            <section className="rounded-[1.4rem] bg-[#dcebb6] p-4" aria-labelledby="weather-title">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-950">
                            <CloudSun className="size-5" />
                            <h3 id="weather-title" className="text-sm font-black">Clima</h3>
                        </div>
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-950/65">
                            <MapPin className="size-3.5" /> Las Breñas, Chaco
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-950/75">Parcialmente nublado</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black tracking-[-0.06em] text-emerald-950">27°</p>
                        <p className="mt-1 text-xs font-bold text-emerald-950/65">Máx. 31° · Mín. 18°</p>
                    </div>
                </div>
                <div className="mt-4 flex gap-5 border-t border-emerald-950/10 pt-3 text-xs font-bold text-emerald-950/65">
                    <span className="flex items-center gap-1.5"><Droplets className="size-3.5" /> 48% humedad</span>
                    <span className="flex items-center gap-1.5"><Wind className="size-3.5" /> NE 14 km/h</span>
                </div>
            </section>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <section className="rounded-[1.4rem] bg-white p-4" aria-labelledby="grain-title">
                    <div className="flex items-center gap-2 text-emerald-800">
                        <Wheat className="size-5" />
                        <div>
                            <h3 id="grain-title" className="text-sm font-black text-stone-950">Valor del cereal</h3>
                            <p className="text-[0.65rem] font-bold text-stone-400">ARS por tonelada · Rosario</p>
                        </div>
                    </div>
                    <MetricList items={GRAIN_PRICES} />
                </section>

                <section className="rounded-[1.4rem] bg-white p-4" aria-labelledby="freight-title">
                    <div className="flex items-center gap-2 text-[#8b5e3c]">
                        <Truck className="size-5" />
                        <div>
                            <h3 id="freight-title" className="text-sm font-black text-stone-950">Tarifas de fletes</h3>
                            <p className="text-[0.65rem] font-bold text-stone-400">Referencia por tonelada</p>
                        </div>
                    </div>
                    <MetricList items={FREIGHT_RATES} suffix="/ tn" />
                </section>
            </div>

            <section className="mt-3 rounded-[1.4rem] bg-[#e3ece8] p-4" aria-labelledby="dollar-title">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#1d5d51]">
                        <CircleDollarSign className="size-5" />
                        <h3 id="dollar-title" className="text-sm font-black text-stone-950">Dólar</h3>
                    </div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-stone-500">ARS por USD</p>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    {DOLLAR_RATES.map((rate) => (
                        <div key={rate.label} className="flex items-baseline justify-between gap-2 border-t border-emerald-950/10 pt-2">
                            <dt className="text-xs font-semibold text-stone-600">{rate.label}</dt>
                            <dd className="text-xs font-black text-stone-950">{rate.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <p className="px-2 pb-1 pt-3 text-center text-[0.65rem] font-semibold text-stone-400">
                Valores ilustrativos para definir el diseño. Todavía no representan datos en tiempo real.
            </p>
        </aside>
    );
}
