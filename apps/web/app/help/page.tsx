import Link from "next/link";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";

const helpItems = [
    { icon: ShieldCheck, title: "Antes de hacer una operación", text: "Verificá la identidad de la otra persona, revisá el producto personalmente cuando sea posible y no envíes dinero sin confirmar las condiciones." },
    { icon: MessageCircle, title: "Mantené el primer contacto en Agroalva", text: "La conversación queda asociada a tu cuenta y podés continuarla desde la web o la aplicación." },
    { icon: Mail, title: "¿Necesitás ayuda?", text: "Escribinos a support@agroalva.com y contanos qué pasó. Incluí el enlace de la publicación si corresponde." },
];

export default function HelpPage() {
    return <main className="min-h-screen"><section className="bg-emerald-950 px-6 py-16 text-white"><div className="mx-auto max-w-4xl"><p className="text-sm font-black uppercase tracking-[0.2em] text-lime-300">Centro de ayuda</p><h1 className="mt-3 text-5xl font-black tracking-tight">Usá Agroalva con confianza</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50/75">Consejos para publicar, conversar y evaluar oportunidades dentro del marketplace.</p></div></section><section className="mx-auto grid max-w-4xl gap-5 px-6 py-12 md:grid-cols-2">{helpItems.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[2rem] border bg-white p-7"><Icon className="size-7 text-emerald-800" /><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 leading-7 text-stone-600">{text}</p></article>)}<article className="rounded-[2rem] border bg-white p-7"><h2 className="text-xl font-black">Documentos</h2><div className="mt-4 flex flex-col gap-2"><Link href="/terms" className="font-bold text-emerald-800">Términos y condiciones</Link><Link href="/privacy" className="font-bold text-emerald-800">Política de privacidad</Link></div></article></section></main>;
}
