import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthGate } from "@/components/marketplace/auth-gate";
import { ListingCollection } from "@/components/marketplace/listing-collection";
import { Button } from "@/components/ui/button";
export default function MyListingsPage() { return <AuthGate><main className="min-h-screen"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Mi actividad</p><h1 className="mt-2 text-4xl font-black">Mis publicaciones</h1></div><Button asChild className="rounded-full bg-emerald-800"><Link href="/publish"><Plus className="size-4" /> Publicar</Link></Button></div><ListingCollection kind="mine" /></div></main></AuthGate>; }
