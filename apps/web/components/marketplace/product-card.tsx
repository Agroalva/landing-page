import Image from "next/image";
import Link from "next/link";
import { MapPin, PackageOpen } from "lucide-react";
import type { MarketplaceListing } from "@/lib/marketplace";
import { formatPrice } from "@/lib/marketplace";
import { FavoriteButton } from "./favorite-button";

export function ProductCard({ product }: { product: MarketplaceListing }) {
    return (
        <article className="group overflow-hidden rounded-[1.6rem] border border-emerald-950/10 bg-white shadow-[0_12px_40px_rgba(32,58,41,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(32,58,41,0.12)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#e8eee5]">
                <Link href={`/product/${product._id}`} className="block h-full">
                    {product.primaryImageUrl ? (
                        <Image src={product.primaryImageUrl} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized />
                    ) : (
                        <div className="flex h-full items-center justify-center text-emerald-900/50"><PackageOpen className="size-12" /></div>
                    )}
                </Link>
                <span className="absolute left-3 top-3 rounded-full bg-emerald-950/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {product.type === "rent" ? "Alquiler" : "Venta"}
                </span>
                <div className="absolute right-3 top-3"><FavoriteButton productId={product._id} compact /></div>
            </div>
            <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{product.category || "Agroalva"}</p>
                <Link href={`/product/${product._id}`}>
                    <h2 className="mt-2 line-clamp-2 text-xl font-bold tracking-tight text-stone-950 group-hover:text-emerald-800">{product.name}</h2>
                </Link>
                <p className="mt-3 text-2xl font-black text-emerald-950">{formatPrice(product.price, product.currency)}</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4 text-sm text-stone-500">
                    <Link href={`/profile/${product.seller.userId}`} className="truncate font-semibold text-stone-700 hover:text-emerald-800">{product.seller.displayName}</Link>
                    {(product.location?.label || product.location?.address) && (
                        <span className="flex max-w-[45%] items-center gap-1 truncate"><MapPin className="size-3.5 shrink-0" />{product.location.label || product.location.address}</span>
                    )}
                </div>
            </div>
        </article>
    );
}
