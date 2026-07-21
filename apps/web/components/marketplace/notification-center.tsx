"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCheck, Heart, MessageCircle } from "lucide-react";
import { api } from "@/lib/convex-api";
import { formatShortDate } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";

export function NotificationCenter() {
    const notifications = useQuery(api.notifications.listForUser, { limit: 100 });
    const markRead = useMutation(api.notifications.markAsRead);
    const markAll = useMutation(api.notifications.markAllAsRead);
    if (!notifications) return <div className="h-80 animate-pulse rounded-3xl bg-stone-100" />;
    return <div><div className="mb-4 flex justify-end"><Button variant="ghost" className="rounded-full" onClick={() => void markAll({})}><CheckCheck className="size-4" /> Marcar todas como leídas</Button></div>{notifications.length === 0 ? <div className="rounded-[2rem] border border-dashed bg-white p-14 text-center"><Bell className="mx-auto size-10 text-emerald-700" /><h2 className="mt-4 text-2xl font-black">No hay notificaciones</h2></div> : <div className="overflow-hidden rounded-[2rem] border bg-white">{notifications.map((notification) => { const href = notification.type === "message" && notification.relatedId ? `/messages/${notification.relatedId}` : notification.relatedId ? `/product/${notification.relatedId}` : "/notifications"; const Icon = notification.type === "message" ? MessageCircle : Heart; return <Link key={notification._id} href={href} onClick={() => !notification.read && void markRead({ notificationId: notification._id })} className={`flex gap-4 border-b p-5 last:border-0 ${notification.read ? "bg-white" : "bg-emerald-50/60"}`}><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Icon className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h2 className="font-black">{notification.title}</h2><span className="text-xs text-stone-500">{formatShortDate(notification.createdAt)}</span></div><p className="mt-1 text-sm text-stone-600">{notification.body}</p></div>{!notification.read && <span className="mt-2 size-2 rounded-full bg-emerald-700" />}</Link>; })}</div>}</div>;
}
