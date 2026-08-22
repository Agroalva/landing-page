"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { Loader2, LockKeyhole, Sprout } from "lucide-react";
import { api } from "@/lib/convex-api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ensureProfile = useMutation(api.users.ensureProfile);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isSignUp = mode === "sign-up";

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        setLoading(true);
        try {
            const result = isSignUp
                ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
                : await authClient.signIn.email({ email: email.trim(), password });
            if (result.error) {
                setError(isSignUp ? "No se pudo crear la cuenta. Revisá los datos o probá con otro correo." : "El correo o la contraseña no son correctos.");
                return;
            }
            if (isSignUp) {
                try { await ensureProfile({}); } catch { /* The profile is also ensured from account pages. */ }
            }
            const redirect = searchParams.get("redirect");
            router.replace(redirect?.startsWith("/") ? redirect : "/");
            router.refresh();
        } catch {
            setError("No pudimos completar la operación. Revisá tu conexión e intentá nuevamente.");
        } finally { setLoading(false); }
    };

    return (
        <div className="w-full max-w-md rounded-[2rem] border border-emerald-950/10 bg-white p-7 shadow-[0_24px_80px_rgba(24,61,40,0.12)] sm:p-9">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">{isSignUp ? <Sprout className="size-6" /> : <LockKeyhole className="size-6" />}</div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-stone-950">{isSignUp ? "Sumate a Agroalva" : "Bienvenido de nuevo"}</h1>
            <p className="mt-2 text-stone-600">{isSignUp ? "Una cuenta para usar Agroalva en la web y en la aplicación." : "Ingresá con la misma cuenta que usás en la aplicación."}</p>
            <form onSubmit={submit} className="mt-7 space-y-5">
                {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
                {isSignUp && <div className="space-y-2"><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="h-12 rounded-xl" /></div>}
                <div className="space-y-2"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 rounded-xl" /></div>
                <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Contraseña</Label>{!isSignUp && <Link href="/forgot-password" className="text-xs font-bold text-emerald-800 hover:underline">¿La olvidaste?</Link>}</div><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} className="h-12 rounded-xl" /></div>
                <Button type="submit" className="h-12 w-full rounded-full bg-emerald-800 text-base" disabled={loading}>{loading ? <><Loader2 className="size-4 animate-spin" /> Procesando...</> : isSignUp ? "Crear cuenta" : "Ingresar"}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-stone-600">{isSignUp ? "¿Ya tenés una cuenta?" : "¿Todavía no tenés cuenta?"} <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-bold text-emerald-800 hover:underline">{isSignUp ? "Ingresar" : "Crear cuenta"}</Link></p>
        </div>
    );
}
