"use client";

import Image from "next/image";
import { useQuery } from "convex/react";
import { ImageOff } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function MessagePhoto({ storageId }: { storageId: Id<"_storage"> }) {
    const url = useQuery(api.storage.getDownloadUrl, { storageId });

    if (url === undefined) {
        return <div className="size-56 animate-pulse rounded-xl bg-stone-200" aria-label="Cargando foto" />;
    }

    if (!url) {
        return (
            <div className="flex size-56 flex-col items-center justify-center gap-2 rounded-xl bg-stone-100 text-stone-400">
                <ImageOff className="size-8" />
                <span className="text-xs">Foto no disponible</span>
            </div>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button type="button" className="block cursor-zoom-in overflow-hidden rounded-xl" aria-label="Ver foto en grande">
                    <Image src={url} alt="Foto enviada en el chat" width={224} height={224} className="size-56 object-cover transition hover:opacity-90" unoptimized />
                </button>
            </DialogTrigger>
            <DialogContent className="w-auto max-w-[95vw] border-0 bg-transparent p-0 shadow-none sm:max-w-[95vw] [&>button]:rounded-full [&>button]:bg-black/60 [&>button]:p-1.5 [&>button]:text-white [&>button]:opacity-100">
                <DialogTitle className="sr-only">Foto del chat</DialogTitle>
                <Image src={url} alt="Foto enviada en el chat" width={1600} height={1600} className="h-auto max-h-[90vh] w-auto max-w-[95vw] rounded-xl object-contain" unoptimized />
            </DialogContent>
        </Dialog>
    );
}
