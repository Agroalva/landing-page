import {
    CircleDollarSign,
    Wheat,
} from "lucide-react";
import { getMarketPulseData } from "@/lib/market-data";
import { WeatherCard } from "@/components/marketplace/weather-card";

const PRICE_FORMATTER = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
});

function formatTradingDate(value: string | null) {
    if (!value) {
        return null;
    }

    const [day, month, year] = value.split("/").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    }).format(date);
}

export async function MarketPulse() {
    const data = await getMarketPulseData();
    const allLive = data.weather.isLive && data.grains.isLive && data.dollars.isLive;
    const someLive = data.weather.isLive || data.grains.isLive || data.dollars.isLive;
    const grainDate = formatTradingDate(data.grains.tradingDate);

    return (
        <aside
            aria-label="Información útil del campo"
            className="mt-10 w-full max-w-xl rounded-[2rem] border border-white/25 bg-[#f8f5ec]/95 p-4 text-stone-950 shadow-[0_28px_80px_rgba(2,25,13,0.28)] backdrop-blur-md lg:mt-0 lg:justify-self-end"
        >
            <div className="flex items-center justify-between gap-4 px-1 pb-4">
                <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-700">Información útil</p>
                    <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Pulso del campo</h2>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.12em] ${allLive ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                    {allLive ? "Actualizado" : someLive ? "Actualización parcial" : "Datos de referencia"}
                </span>
            </div>

            <WeatherCard initialWeather={data.weather} />

            <section className="mt-3 rounded-[1.4rem] bg-white p-4" aria-labelledby="grain-title">
                <div className="flex items-center gap-2 text-emerald-800">
                    <Wheat className="size-5" />
                    <div>
                        <h3 id="grain-title" className="text-sm font-black text-stone-950">Valor del cereal</h3>
                        <p className="text-[0.65rem] font-bold text-stone-400">ARS por tonelada · Rosario{grainDate ? ` · ${grainDate}` : ""}</p>
                    </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 divide-x divide-stone-900/8 border-t border-stone-900/8 pt-3">
                    {data.grains.prices.map((grain) => (
                        <div key={grain.label} className="px-2 text-center first:pl-0 last:pr-0">
                            <dt className="text-xs font-semibold text-stone-500">{grain.label}</dt>
                            <dd className="mt-1 text-sm font-black text-stone-950">{PRICE_FORMATTER.format(grain.value)}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <section className="mt-3 rounded-[1.4rem] bg-[#e3ece8] p-4" aria-labelledby="dollar-title">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#1d5d51]">
                        <CircleDollarSign className="size-5" />
                        <h3 id="dollar-title" className="text-sm font-black text-stone-950">Dólar</h3>
                    </div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-stone-500">Venta · ARS por USD</p>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    {data.dollars.rates.map((rate) => (
                        <div key={rate.label} className="flex items-baseline justify-between gap-2 border-t border-emerald-950/10 pt-2">
                            <dt className="text-xs font-semibold text-stone-600">{rate.label}</dt>
                            <dd className="text-xs font-black text-stone-950">{PRICE_FORMATTER.format(rate.value)}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <p className="px-2 pb-1 pt-3 text-center text-[0.65rem] font-semibold text-stone-400">
                Fuentes: <a href="https://www.weatherapi.com/" target="_blank" rel="noreferrer" className="underline decoration-stone-300 underline-offset-2 hover:text-stone-600">WeatherAPI.com</a> · Cámara Arbitral de Cereales de Rosario · DolarAPI.
                {!allLive && " El clima no muestra valores cuando la fuente no está disponible; los mercados pueden mostrar valores de referencia."}
            </p>
        </aside>
    );
}
