"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setLoading(true);
        try {
            await authClient.requestPasswordReset({ email: email.trim(), redirectTo: `${window.location.origin}/reset-password` });
            setSent(true);
        } finally { setLoading(false); }
    };
    return <main className="flex min-h-[70vh] items-center justify-center px-4 py-14"><div className="w-full max-w-md rounded-[2rem] border bg-white p-8 shadow-sm"><Mail className="size-9 text-emerald-800" /><h1 className="mt-5 text-3xl font-black">Recuperar contraseña</h1>{sent ? <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900">Si existe una cuenta con ese correo, te enviamos un enlace para cambiar la contraseña.</div> : <form onSubmit={submit} className="mt-6 space-y-4"><p className="text-stone-600">Ingresá el correo asociado a tu cuenta.</p><div className="space-y-2"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" /></div><Button className="h-12 w-full rounded-full bg-emerald-800" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace"}</Button></form>}<Link href="/sign-in" className="mt-6 inline-block text-sm font-bold text-emerald-800">Volver a ingresar</Link></div></main>;
}
