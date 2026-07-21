import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";

export const metadata: Metadata = {
    title: "Marketplace del agro argentino | Agroalva",
    description: "Encontrá maquinaria, insumos, productos y servicios para el campo en Agroalva.",
};

export default function MarketplacePage() {
    return (
        <main className="min-h-screen bg-[#f7f6ef]">
            <section className="border-b border-emerald-950/10 bg-[radial-gradient(circle_at_top_left,rgba(219,232,199,0.9),transparent_40%),#f7f6ef]">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">El campo, conectado</p>
                    <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] text-stone-950 md:text-6xl">Todo lo que necesitás para hacer crecer tu actividad.</h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">Comprá, vendé o alquilá directamente con productores, empresas y prestadores de toda Argentina.</p>
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <MarketplaceBrowser />
            </section>
        </main>
    );
}
