import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, Images, MapPin, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/footer";
import { ProductActions } from "@/components/marketplace/product-actions";
import { Button } from "@/components/ui/button";
import { fetchMarketplaceProduct, getProductShareDescription } from "@/lib/product-share";
import { formatPrice, formatShortDate } from "@/lib/marketplace";

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params;
    const product = await fetchMarketplaceProduct(id);
    if (!product) {
        return { title: "Publicación no disponible | Agroalva", robots: { index: false, follow: false } };
    }
    const description = getProductShareDescription(product);
    return {
        title: `${product.name} | Agroalva`,
        description,
        alternates: { canonical: `/product/${id}` },
        openGraph: { title: product.name, description, type: "article", url: `/product/${id}`, images: [product.imageUrls[0] || "/favicon-512.png"] },
        twitter: { card: "summary_large_image", title: product.name, description, images: [product.imageUrls[0] || "/favicon-512.png"] },
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const product = await fetchMarketplaceProduct(id);

    if (!product) {
        return (
            <main className="min-h-[75vh] bg-[#f7f6ef] px-6 py-20">
                <div className="mx-auto max-w-2xl rounded-[2rem] border bg-white p-10 text-center shadow-sm">
                    <h1 className="text-3xl font-black text-stone-950">Esta publicación ya no está disponible</h1>
                    <p className="mt-3 text-stone-600">Puede haberse eliminado o el enlace puede ser incorrecto.</p>
                    <Button asChild className="mt-7 rounded-full bg-emerald-800"><Link href="/marketplace">Explorar otras publicaciones</Link></Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f6ef]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-emerald-800"><ArrowLeft className="size-4" /> Volver al marketplace</Link>

                <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
                    <div className="space-y-6">
                        <div className="grid overflow-hidden rounded-[2rem] bg-stone-200 shadow-[0_20px_70px_rgba(31,55,39,0.12)] sm:grid-cols-2 sm:grid-rows-2">
                            {(product.imageUrls.length ? product.imageUrls.slice(0, 5) : [""]).map((url, index) => (
                                <div key={`${url}-${index}`} className={`relative min-h-60 bg-[#e4ebe0] ${index === 0 ? "sm:row-span-2 sm:min-h-[620px]" : "hidden sm:block"}`}>
                                    {url ? <Image src={url} alt={`${product.name}, imagen ${index + 1}`} fill className="object-cover" unoptimized priority={index === 0} /> : <div className="flex h-full items-center justify-center text-emerald-900/40"><Images className="size-14" /></div>}
                                    {index === 0 && product.imageUrls.length > 1 && <span className="absolute bottom-4 right-4 rounded-full bg-black/65 px-4 py-2 text-sm font-bold text-white">{product.imageUrls.length} fotos</span>}
                                </div>
                            ))}
                        </div>

                        <section className="rounded-[2rem] border border-emerald-950/10 bg-white p-6 md:p-8">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">{product.type === "rent" ? "Alquiler / servicio" : "Venta"} · {product.category || "Agroalva"}</p>
                                    <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-stone-950 md:text-5xl">{product.name}</h1>
                                </div>
                                <p className="text-3xl font-black text-emerald-950">{formatPrice(product.price, product.currency)}</p>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-5 text-sm text-stone-500">
                                <span>Publicado {formatShortDate(product.createdAt)}</span>
                                <span className="flex items-center gap-1"><Eye className="size-4" /> {product.viewCount} visualizaciones</span>
                                {(product.location?.label || product.location?.address) && <span className="flex items-center gap-1"><MapPin className="size-4" /> {product.location.label || product.location.address}</span>}
                            </div>
                            <div className="mt-8 border-t pt-7">
                                <h2 className="text-xl font-black text-stone-950">Descripción</h2>
                                <p className="mt-3 whitespace-pre-wrap leading-8 text-stone-700">{product.description || "El vendedor no agregó una descripción."}</p>
                            </div>
                            {product.attributes && Object.keys(product.attributes).length > 0 && (
                                <div className="mt-8 border-t pt-7">
                                    <h2 className="text-xl font-black text-stone-950">Características</h2>
                                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {Object.entries(product.attributes).map(([key, value]) => <div key={key} className="rounded-2xl bg-stone-50 px-4 py-3"><dt className="text-xs font-black uppercase tracking-wide text-stone-500">{key.split("_").join(" ")}</dt><dd className="mt-1 font-semibold text-stone-900">{formatAttribute(value)}</dd></div>)}
                                    </dl>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-[2rem] border border-emerald-950/10 bg-white p-6 shadow-[0_16px_50px_rgba(32,58,41,0.08)]">
                            <ProductActions productId={product._id} authorId={product.authorId} productName={product.name} />
                        </div>
                        <div className="rounded-[2rem] border border-emerald-950/10 bg-white p-6">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Publicado por</p>
                            <div className="mt-4 flex items-center gap-4">
                                {product.seller.avatarUrl ? <Image src={product.seller.avatarUrl} alt={product.seller.displayName} width={56} height={56} className="size-14 rounded-full object-cover" unoptimized /> : <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-800">{product.seller.displayName.charAt(0)}</div>}
                                <div><Link href={`/profile/${product.authorId}`} className="text-lg font-black text-stone-950 hover:text-emerald-800">{product.seller.displayName}</Link><p className="text-sm text-stone-500">Miembro de Agroalva</p></div>
                            </div>
                            {product.seller.bio && <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">{product.seller.bio}</p>}
                            <Link href={`/profile/${product.authorId}`} className="mt-4 inline-block text-sm font-bold text-emerald-800 hover:underline">Ver perfil y publicaciones</Link>
                        </div>
                        <div className="rounded-[2rem] bg-emerald-950 p-6 text-white"><ShieldCheck className="size-6 text-lime-300" /><h2 className="mt-4 text-lg font-bold">Comprá y vendé con cuidado</h2><p className="mt-2 text-sm leading-6 text-emerald-50/75">Verificá la información y no envíes dinero antes de confirmar la identidad y las condiciones de la operación.</p><Link href="/help" className="mt-4 inline-block text-sm font-bold text-lime-300">Consejos de seguridad</Link></div>
                    </aside>
                </div>
            </div>
            <Footer />
        </main>
    );
}

function formatAttribute(value: unknown) {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (value && typeof value === "object") {
        const range = value as { min?: number; max?: number };
        return [range.min !== undefined ? `Desde ${range.min}` : "", range.max !== undefined ? `hasta ${range.max}` : ""].filter(Boolean).join(" ");
    }
    return String(value);
}
