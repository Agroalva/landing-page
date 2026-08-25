import { AuthGate } from "@/components/marketplace/auth-gate";
import { ListingCollection } from "@/components/marketplace/listing-collection";
export default function FavoritesPage() { return <AuthGate><main className="min-h-screen"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Tu selección</p><h1 className="mt-2 mb-8 text-4xl font-black">Favoritos</h1><ListingCollection kind="favorites" /></div></main></AuthGate>; }
