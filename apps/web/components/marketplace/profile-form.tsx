"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api, type Id } from "@/lib/convex-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileForm() {
    const profile = useQuery(api.users.getMe);
    const updateProfile = useMutation(api.users.updateProfile);
    const ensureProfile = useMutation(api.users.ensureProfile);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    if (profile === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />;

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setSaving(true); setMessage(null);
        try {
            if (!profile) await ensureProfile({});
            const data = new FormData(event.currentTarget);
            let avatarId = profile?.avatarId;
            const file = data.get("avatar") as File;
            if (file?.size) {
                const uploadUrl = await generateUploadUrl({});
                const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
                avatarId = (await response.json()).storageId as Id<"_storage">;
            }
            await updateProfile({ displayName: String(data.get("displayName") || "").trim(), bio: String(data.get("bio") || "").trim() || undefined, phoneNumber: String(data.get("phoneNumber") || "").trim() || undefined, avatarId });
            setMessage("Perfil actualizado.");
        } catch { setMessage("No pudimos guardar los cambios."); } finally { setSaving(false); }
    };
    return <form onSubmit={submit} className="form-section"><div className="space-y-2"><Label htmlFor="displayName">Nombre visible</Label><Input id="displayName" name="displayName" defaultValue={profile?.displayName || ""} required className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="bio">Presentación</Label><Textarea id="bio" name="bio" defaultValue={profile?.bio || ""} rows={5} className="rounded-xl" /></div><div className="space-y-2"><Label htmlFor="phoneNumber">Teléfono</Label><Input id="phoneNumber" name="phoneNumber" defaultValue={profile?.phoneNumber || ""} className="h-12 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="avatar">Imagen de perfil</Label><Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="h-12 rounded-xl pt-2.5" /></div>{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}<Button disabled={saving} className="h-12 rounded-full bg-emerald-800 px-7">{saving ? "Guardando..." : "Guardar perfil"}</Button></form>;
}
