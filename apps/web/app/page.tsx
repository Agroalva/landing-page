import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Search, Sprout } from "lucide-react";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main className="min-h-screen bg-[#f7f6ef]">
            <section className="relative overflow-hidden border-b border-emerald-950/10">
                <Image src="/abstract-agricultural-field-pattern-aerial-view.jpg" alt="Campos agrícolas vistos desde el aire" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,48,31,0.96)_0%,rgba(22,72,45,0.88)_48%,rgba(22,72,45,0.30)_100%)]" />
                <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
                    <div className="max-w-3xl text-white">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur"><Sprout className="size-4 text-lime-300" /> Marketplace del agro argentino</div>
                        <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">El campo tiene todo. Ahora también tiene dónde encontrarse.</h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-emerald-50/90 md:text-xl">Maquinaria, insumos, producción y servicios. Publicá o encontrá lo que necesitás desde cualquier dispositivo.</p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="h-13 rounded-full bg-[#d9ed9f] px-7 font-bold text-emerald-950 hover:bg-[#e5f6b5]"><Link href="/marketplace"><Search className="size-5" /> Explorar marketplace</Link></Button>
                            <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-white/30 bg-white/10 px-7 text-white hover:bg-white hover:text-emerald-950"><Link href="/publish">Publicar gratis <ArrowRight className="size-5" /></Link></Button>
                        </div>
                        <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-emerald-50/90">
                            <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-lime-300" /> Una cuenta en web y app</span>
                            <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-lime-300" /> Contacto directo</span>
                            <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-lime-300" /> En toda Argentina</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div><p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">Recién publicado</p><h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-stone-950">Oportunidades del agro</h2></div>
                    <Link href="/marketplace" className="inline-flex items-center gap-2 font-bold text-emerald-800 hover:underline">Ver todo <ArrowRight className="size-4" /></Link>
                </div>
                <MarketplaceBrowser compact />
            </section>

            <section className="bg-[#163f2a] px-4 py-16 text-white sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
                    {[['01','Encontrá','Buscá por categoría, tipo de publicación y palabras clave.'],['02','Conectá','Conocé el perfil del vendedor y conversá dentro de Agroalva.'],['03','Hacé negocio','Continuá desde la web o la aplicación con la misma cuenta.']].map(([n,title,text]) => <div key={n} className="border-t border-white/20 pt-6"><span className="text-sm font-black text-lime-300">{n}</span><h3 className="mt-5 text-2xl font-bold">{title}</h3><p className="mt-2 leading-7 text-emerald-50/75">{text}</p></div>)}
                </div>
            </section>
            <Footer />
        </main>
    );
}
