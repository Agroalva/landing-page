"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";

export function AuthGate({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { isAuthenticated, isLoading } = useAuthSession();

    if (isLoading) {
        return <div className="mx-auto my-24 h-48 max-w-3xl animate-pulse rounded-3xl bg-stone-100" />;
    }
    if (!isAuthenticated) {
        return (
            <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-6 py-16">
                <div className="w-full rounded-[2rem] border border-emerald-950/10 bg-white p-8 text-center shadow-[0_24px_80px_rgba(24,61,40,0.10)]">
                    <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
                        <LockKeyhole className="size-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-stone-950">Ingresá para continuar</h1>
                    <p className="mt-3 text-stone-600">Usá la misma cuenta de Agroalva que ya tenés en la aplicación.</p>
                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button asChild className="rounded-full bg-emerald-800 px-6">
                            <Link href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}>Ingresar</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full px-6">
                            <Link href={`/sign-up?redirect=${encodeURIComponent(pathname)}`}>Crear cuenta</Link>
                        </Button>
                    </div>
                </div>
            </main>
        );
    }
    return children;
}
