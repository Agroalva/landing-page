import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    BriefcaseBusiness,
    PackageOpen,
    Search,
    Tractor,
    UsersRound,
    Wrench,
} from "lucide-react";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { MarketPulse } from "@/components/marketplace/market-pulse";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

const MARKETPLACE_PATHS = [
    {
        title: "Productos",
        eyebrow: "Compra y venta",
        description: "Maquinaria, vehículos, insumos, repuestos y producción.",
        href: "/?type=sell#catalogo",
        icon: PackageOpen,
        accent: "bg-[#dcebb6] text-[#173f2a]",
        iconSurface: "bg-[#173f2a] text-white",
    },
    {
        title: "Servicios",
        eyebrow: "Soluciones para el campo",
        description: "Alquiler de equipos, transporte y trabajos especializados.",
        href: "/?type=rent#catalogo",
        icon: Wrench,
        accent: "bg-[#dce9e5] text-[#153d36]",
        iconSurface: "bg-[#1d5d51] text-white",
    },
    {
        title: "Personal",
        eyebrow: "Empleo y oficios",
        description: "Encontrá talento rural u ofrecé tu experiencia profesional.",
        href: "/?type=rent&family=personal&category=personal_services#catalogo",
        icon: UsersRound,
        accent: "bg-[#eee2cf] text-[#4a3423]",
        iconSurface: "bg-[#8b5e3c] text-white",
    },
];

export default function Home() {
    return (
        <main className="min-h-screen bg-[#f5f2e9]">
            <section className="relative overflow-hidden bg-[#133d29] text-white">
                <Image
                    src="/abstract-agricultural-field-pattern-aerial-view.jpg"
                    alt="Campos agrícolas vistos desde el aire"
                    fill
                    className="object-cover object-center"
                    priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,48,30,0.98)_0%,rgba(18,65,40,0.92)_52%,rgba(18,65,40,0.22)_100%)]" />
                <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-4 pb-28 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-32 lg:pt-20">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
                            <Tractor className="size-4 text-[#d9ed9f]" />
                            El mercado digital del agro argentino
                        </div>
                        <h1 className="mt-7 text-5xl font-black leading-[0.94] tracking-[-0.055em] md:text-7xl">
                            Todo el campo.
                            <span className="block text-[#d9ed9f]">En un solo lugar.</span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/85 md:text-xl">
                            Comprá productos, contratá servicios y conectá con el personal que tu actividad necesita.
                        </p>

                        <form
                            action="/#catalogo"
                            method="get"
                            className="mt-8 flex max-w-2xl flex-col gap-2 rounded-[1.4rem] bg-white p-2 shadow-[0_20px_60px_rgba(3,24,14,0.28)] sm:flex-row"
                        >
                            <label className="relative min-w-0 flex-1">
                                <span className="sr-only">Buscar en Agroalva</span>
                                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
                                <input
                                    name="q"
                                    type="search"
                                    placeholder="¿Qué estás buscando?"
                                    className="h-13 w-full rounded-2xl bg-transparent pl-12 pr-4 text-base font-medium text-stone-950 outline-none placeholder:text-stone-400"
                                />
                            </label>
                            <Button type="submit" size="lg" className="h-13 rounded-2xl bg-[#1f5b3b] px-7 font-bold hover:bg-[#17472e]">
                                Buscar
                                <ArrowRight className="size-4" />
                            </Button>
                        </form>

                        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-emerald-50/80">
                            <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#d9ed9f]" /> Contacto directo</span>
                            <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#d9ed9f]" /> Una cuenta en web y app</span>
                            <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-[#d9ed9f]" /> En toda Argentina</span>
                        </div>
                    </div>
                    <MarketPulse />
                </div>
            </section>

            <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Categorías principales">
                <div className="grid gap-4 lg:grid-cols-3">
                    {MARKETPLACE_PATHS.map((path) => {
                        const Icon = path.icon;
                        return (
                            <Link
                                key={path.title}
                                href={path.href}
                                className={`group flex min-h-56 flex-col rounded-[1.8rem] p-6 shadow-[0_18px_55px_rgba(29,55,37,0.13)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(29,55,37,0.18)] ${path.accent}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <span className={`flex size-12 items-center justify-center rounded-2xl ${path.iconSurface}`}>
                                        <Icon className="size-6" />
                                    </span>
                                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                                </div>
                                <div className="mt-auto pt-8">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-65">{path.eyebrow}</p>
                                    <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">{path.title}</h2>
                                    <p className="mt-2 max-w-sm leading-6 opacity-75">{path.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section id="catalogo" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                                <BriefcaseBusiness className="size-4" /> Mercado agropecuario
                            </p>
                            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.045em] text-stone-950 md:text-5xl">
                                Encontrá tu próxima oportunidad.
                            </h2>
                            <p className="mt-3 max-w-2xl text-lg leading-7 text-stone-600">
                                Buscá, filtrá y conectá sin salir de esta página.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="w-fit rounded-full border-emerald-900/20 bg-white px-6 font-bold text-emerald-900">
                            <Link href="/publish">Publicar gratis <ArrowRight className="size-4" /></Link>
                        </Button>
                    </div>
                    <MarketplaceBrowser />
                </div>
            </section>

            <section className="bg-[#163f2a] px-4 py-16 text-white sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
                    {[
                        { icon: Search, title: "Encontrá", text: "Explorá productos, servicios y perfiles para cada etapa de tu actividad." },
                        { icon: UsersRound, title: "Conectá", text: "Conocé quién publica y conversá directamente dentro de Agroalva." },
                        { icon: BriefcaseBusiness, title: "Hacé negocio", text: "Comprá, vendé, contratá o encontrá trabajo desde la web o la app." },
                    ].map(({ icon: Icon, title, text }, index) => (
                        <div key={title} className="border-t border-white/20 pt-6">
                            <div className="flex items-center justify-between">
                                <Icon className="size-5 text-[#d9ed9f]" />
                                <span className="text-xs font-black text-emerald-50/45">0{index + 1}</span>
                            </div>
                            <h3 className="mt-7 text-2xl font-bold">{title}</h3>
                            <p className="mt-2 leading-7 text-emerald-50/70">{text}</p>
                        </div>
                    ))}
                </div>
            </section>
            <Footer />
        </main>
    );
}
