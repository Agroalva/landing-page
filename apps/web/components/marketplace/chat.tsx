"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Send } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Chat({ conversationId }: { conversationId: string }) {
    const typedId = conversationId as Id<"conversations">;
    const { user } = useAuthSession();
    const conversations = useQuery(api.marketplace.conversations);
    const messages = useQuery(api.conversations.listMessages, { conversationId: typedId, limit: 100 });
    const sendMessage = useMutation(api.conversations.sendMessage);
    const markRead = useMutation(api.conversations.markMessagesAsRead);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const summary = conversations?.find((item) => item._id === conversationId);

    useEffect(() => {
        if (messages?.length) void markRead({ conversationId: typedId });
    }, [conversationId, markRead, messages?.length, typedId]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const next = text.trim(); if (!next) return;
        setSending(true);
        try { await sendMessage({ conversationId: typedId, text: next }); setText(""); }
        finally { setSending(false); }
    };

    return <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col overflow-hidden rounded-[2rem] border bg-white shadow-sm"><header className="flex items-center gap-4 border-b px-5 py-4"><Button asChild variant="ghost" size="icon" className="rounded-full"><Link href="/messages"><ArrowLeft className="size-5" /></Link></Button><div><h1 className="font-black text-stone-950">{summary?.otherDisplayName || "Conversación"}</h1><p className="text-xs text-stone-500">Mensajes en Agroalva</p></div></header><div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f6ef] p-5">{messages === undefined ? <p className="text-center text-sm text-stone-500">Cargando mensajes...</p> : messages.length === 0 ? <p className="mt-16 text-center text-stone-500">Escribí el primer mensaje.</p> : messages.map((message) => { const mine = message.senderId === user?.id; return <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 ${mine ? "rounded-br-sm bg-emerald-800 text-white" : "rounded-bl-sm border bg-white text-stone-900"}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p><p className={`mt-1 text-[0.65rem] ${mine ? "text-emerald-100" : "text-stone-400"}`}>{new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}</p></div></div>; })}</div><form onSubmit={submit} className="flex gap-3 border-t p-4"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí un mensaje..." maxLength={2000} className="h-12 rounded-full" /><Button type="submit" size="icon" disabled={sending || !text.trim()} className="size-12 shrink-0 rounded-full bg-emerald-800" aria-label="Enviar mensaje"><Send className="size-5" /></Button></form></div>;
}
