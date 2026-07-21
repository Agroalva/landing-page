"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/convex-api";
import { formatShortDate } from "@/lib/marketplace";

export function ConversationList() {
    const conversations = useQuery(api.marketplace.conversations);
    if (!conversations) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />)}</div>;
    if (!conversations.length) return <div className="rounded-[2rem] border border-dashed bg-white px-6 py-16 text-center"><MessageCircle className="mx-auto size-10 text-emerald-700" /><h2 className="mt-4 text-2xl font-black">Todavía no tenés conversaciones</h2><p className="mt-2 text-stone-600">Abrí una publicación y contactá a quien la publicó.</p></div>;
    return <div className="overflow-hidden rounded-[2rem] border bg-white">{conversations.map((conversation) => <Link key={conversation._id} href={`/messages/${conversation._id}`} className="flex items-center gap-4 border-b p-5 transition last:border-b-0 hover:bg-emerald-50/50">{conversation.otherAvatarUrl ? <Image src={conversation.otherAvatarUrl} alt="" width={52} height={52} className="size-13 rounded-full object-cover" unoptimized /> : <div className="flex size-13 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800">{conversation.otherDisplayName.charAt(0)}</div>}<div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-3"><h2 className="truncate font-black text-stone-950">{conversation.otherDisplayName}</h2><span className="shrink-0 text-xs text-stone-500">{formatShortDate(conversation.lastMessageAt || conversation.createdAt)}</span></div><p className="mt-1 truncate text-sm text-stone-600">{conversation.lastMessageText || "Conversación iniciada"}</p></div>{conversation.unreadCount > 0 && <span className="flex size-7 items-center justify-center rounded-full bg-emerald-800 text-xs font-black text-white">{conversation.unreadCount}</span>}</Link>)}</div>;
}
