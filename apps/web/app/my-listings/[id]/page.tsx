import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthGate } from "@/components/marketplace/auth-gate";
import { ProductStatsDashboard } from "@/components/marketplace/listing-stats";

export const metadata: Metadata = {
    title: "Estadísticas de la publicación | Agroalva",
    robots: { index: false, follow: false },
};

export default async function ListingStatsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <AuthGate>
            <main className="min-h-screen bg-[#f7f6ef]">
                <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
                    <Link href="/my-listings" className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-emerald-800"><ArrowLeft className="size-4" /> Mis publicaciones</Link>
                    <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Estadísticas</p>
                    <div className="mt-2">
                        <ProductStatsDashboard productId={id} />
                    </div>
                </div>
            </main>
        </AuthGate>
    );
}
