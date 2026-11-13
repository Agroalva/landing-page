"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ImagePlus, Send, X } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessagePhoto } from "@/components/marketplace/message-photo";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_PHOTO_DIMENSION = 1600;

// Resizes to at most 1600px and re-encodes as JPEG (same as the mobile app).
// Falls back to the original file if the browser can't decode it.
async function compressPhoto(file: File): Promise<Blob> {
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return file;
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.7));
        return blob && blob.size < file.size ? blob : file;
    } catch {
        return file;
    }
}

export function Chat({ conversationId }: { conversationId: string }) {
    const typedId = conversationId as Id<"conversations">;
    const { user } = useAuthSession();
    const conversations = useQuery(api.marketplace.conversations);
    const messages = useQuery(api.conversations.listMessages, { conversationId: typedId, limit: 100 });
    const sendMessage = useMutation(api.conversations.sendMessage);
    const markRead = useMutation(api.conversations.markMessagesAsRead);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const summary = conversations?.find((item) => item._id === conversationId);

    useEffect(() => {
        if (messages?.length) void markRead({ conversationId: typedId });
    }, [conversationId, markRead, messages?.length, typedId]);

    useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.previewUrl); }, [photo]);

    const pickPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) { setPhotoError("Elegí un archivo de imagen."); return; }
        if (file.size > MAX_PHOTO_BYTES) { setPhotoError("La foto supera los 15 MB."); return; }
        setPhotoError(null);
        setPhoto({ file, previewUrl: URL.createObjectURL(file) });
    };

    const uploadPhoto = async (file: File) => {
        const blob = await compressPhoto(file);
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
        if (!response.ok) throw new Error("No se pudo subir la foto.");
        const result = await response.json();
        return result.storageId as Id<"_storage">;
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const next = text.trim();
        if (!next && !photo) return;
        setSending(true);
        setPhotoError(null);
        try {
            const mediaId = photo ? await uploadPhoto(photo.file) : undefined;
            await sendMessage({ conversationId: typedId, text: next, mediaId });
            setText("");
            setPhoto(null);
        } catch (error) {
            console.error("Send message failed", error);
            setPhotoError(photo ? "No pudimos enviar la foto. Probá de nuevo." : "No pudimos enviar el mensaje. Probá de nuevo.");
        } finally {
            setSending(false);
        }
    };

    return <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col overflow-hidden rounded-[2rem] border bg-white shadow-sm"><header className="flex items-center gap-4 border-b px-5 py-4"><Button asChild variant="ghost" size="icon" className="rounded-full"><Link href="/messages"><ArrowLeft className="size-5" /></Link></Button><div><h1 className="font-black text-stone-950">{summary?.otherDisplayName || "Conversación"}</h1><p className="text-xs text-stone-500">Mensajes en Agroalva</p></div></header><div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f6ef] p-5">{messages === undefined ? <p className="text-center text-sm text-stone-500">Cargando mensajes...</p> : messages.length === 0 ? <p className="mt-16 text-center text-stone-500">Escribí el primer mensaje.</p> : messages.map((message) => { const mine = message.senderId === user?.id; const caption = message.mediaId && message.textIsFallback ? "" : message.text; return <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl ${message.mediaId ? "p-1.5 pb-2" : "px-4 py-3"} ${mine ? "rounded-br-sm bg-emerald-800 text-white" : "rounded-bl-sm border bg-white text-stone-900"}`}>{message.mediaId && <MessagePhoto storageId={message.mediaId} />}{caption && <p className={`whitespace-pre-wrap text-sm leading-6 ${message.mediaId ? "mt-1.5 px-2.5" : ""}`}>{caption}</p>}<p className={`mt-1 text-[0.65rem] ${message.mediaId ? "px-2.5" : ""} ${mine ? "text-emerald-100" : "text-stone-400"}`}>{new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}</p></div></div>; })}</div><form onSubmit={submit} className="border-t p-4">{(photo || photoError) && <div className="mb-3 flex items-center gap-3">{photo && <div className="relative"><img src={photo.previewUrl} alt="Foto a enviar" className="size-20 rounded-xl object-cover" /><button type="button" onClick={() => setPhoto(null)} disabled={sending} className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-stone-900 text-white" aria-label="Quitar foto"><X className="size-3.5" /></button></div>}{photo && <p className="text-xs text-stone-500">{sending ? "Enviando foto..." : "Podés agregar un comentario antes de enviarla."}</p>}{photoError && <p className="text-sm font-semibold text-red-700">{photoError}</p>}</div>}<div className="flex gap-3"><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} /><Button type="button" variant="outline" size="icon" disabled={sending} onClick={() => fileInputRef.current?.click()} className="size-12 shrink-0 rounded-full" aria-label="Adjuntar foto"><ImagePlus className="size-5" /></Button><Input value={text} onChange={(e) => setText(e.target.value)} placeholder={photo ? "Agregá un comentario..." : "Escribí un mensaje..."} maxLength={2000} className="h-12 rounded-full" /><Button type="submit" size="icon" disabled={sending || (!text.trim() && !photo)} className="size-12 shrink-0 rounded-full bg-emerald-800" aria-label="Enviar mensaje"><Send className="size-5" /></Button></div></form></div>;
}
