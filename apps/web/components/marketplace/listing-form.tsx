"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ImagePlus, Loader2, MapPin, Trash2 } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import type { MarketplaceProduct } from "@/lib/marketplace";
import { getCategoriesForFamily, getCategoryById, getFamilies, type AttributeDefinition, type AttributeValue, type AttributeValueMap, type FamilyId } from "../../../app/config/taxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FAMILIES = getFamilies();

export function ListingForm({ product }: { product?: MarketplaceProduct }) {
    const router = useRouter();
    const createProduct = useMutation(api.products.create);
    const updateProduct = useMutation(api.products.update);
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
    const [name, setName] = useState(product?.name || "");
    const [description, setDescription] = useState(product?.description || "");
    const [type, setType] = useState<"sell" | "rent">(product?.type || "sell");
    const [familyId, setFamilyId] = useState(product?.familyId || "");
    const [categoryId, setCategoryId] = useState(product?.categoryId || "");
    const [price, setPrice] = useState(product?.price?.toString() || "");
    const [currency, setCurrency] = useState(product?.currency || "ARS");
    const [location, setLocation] = useState(product?.location?.label || product?.location?.address || "");
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
    const [attributes, setAttributes] = useState<AttributeValueMap>((product?.attributes || {}) as AttributeValueMap);
    const [keptMedia, setKeptMedia] = useState((product?.mediaIds || []).map((id, index) => ({ id, url: product?.imageUrls[index] })));
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const categories = familyId ? getCategoriesForFamily(familyId as FamilyId) : [];
    const category = getCategoryById(categoryId);
    const imageCount = keptMedia.length + files.length;

    const uploadFile = async (file: File) => {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });
        if (!response.ok) throw new Error("No se pudo subir una imagen.");
        const result = await response.json();
        return result.storageId as Id<"_storage">;
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setError(null);
        if (!familyId || !categoryId) { setError("Elegí una familia y una categoría."); return; }
        if (imageCount < 1) { setError("Agregá al menos una imagen."); return; }
        setLoading(true);
        try {
            const uploaded = await Promise.all(files.map(uploadFile));
            const mediaIds = [...keptMedia.map((item) => item.id as Id<"_storage">), ...uploaded];
            const payload = {
                name: name.trim(), description: description.trim() || undefined, type,
                familyId, categoryId, category: category?.label,
                attributes: Object.keys(attributes).length ? attributes : undefined,
                price: price ? Number(price) : undefined, currency,
                mediaIds,
                location: coordinates ? { ...coordinates, label: location.trim() || undefined } : undefined,
            };
            const productId = product
                ? (await updateProduct({ productId: product._id as Id<"products">, ...payload }), product._id)
                : await createProduct(payload);
            router.push(`/product/${productId}`);
            router.refresh();
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "No se pudo guardar la publicación.");
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={submit} className="space-y-7">
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
            <section className="form-section">
                <div><p className="form-kicker">Información principal</p><h2 className="form-title">Contanos qué ofrecés</h2></div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="name">Título</Label><Input id="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Tractor John Deere 6110J" className="h-12 rounded-xl" /></div>
                    <div className="space-y-2"><Label htmlFor="type">Tipo</Label><select id="type" className="form-select" value={type} onChange={(e) => setType(e.target.value as "sell" | "rent")}><option value="sell">Venta</option><option value="rent">Alquiler / servicio</option></select></div>
                    <div className="space-y-2"><Label htmlFor="price">Precio</Label><div className="flex gap-2"><select aria-label="Moneda" className="form-select w-28" value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="ARS">ARS</option><option value="USD">USD</option></select><Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Opcional" className="h-12 rounded-xl" /></div></div>
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Estado, características, condiciones y cualquier información útil..." className="rounded-xl" /></div>
                </div>
            </section>

            <section className="form-section">
                <div><p className="form-kicker">Clasificación</p><h2 className="form-title">Ayudá a que la encuentren</h2></div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="family">Familia</Label><select id="family" required className="form-select" value={familyId} onChange={(e) => { setFamilyId(e.target.value); setCategoryId(""); setAttributes({}); }}><option value="">Seleccionar</option>{FAMILIES.map((family) => <option key={family.id} value={family.id}>{family.label}</option>)}</select></div>
                    <div className="space-y-2"><Label htmlFor="category">Categoría</Label><select id="category" required disabled={!familyId} className="form-select" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setAttributes({}); }}><option value="">Seleccionar</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
                </div>
                {category?.attributes && category.attributes.length > 0 && <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">{category.attributes.map((attribute) => <AttributeField key={attribute.id} attribute={attribute} value={attributes[attribute.id]} setValue={(value) => setAttributes((current) => ({ ...current, [attribute.id]: value }))} />)}</div>}
            </section>

            <section className="form-section">
                <div><p className="form-kicker">Imágenes</p><h2 className="form-title">Mostrá los detalles</h2><p className="mt-2 text-sm text-stone-500">Entre 1 y 5 imágenes JPG, PNG o WebP.</p></div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {keptMedia.map((item) => <div key={item.id} className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">{item.url && <Image src={item.url} alt="Imagen actual" fill className="object-cover" unoptimized />}<button type="button" aria-label="Quitar imagen" onClick={() => setKeptMedia((current) => current.filter((media) => media.id !== item.id))} className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"><Trash2 className="size-4" /></button></div>)}
                    {files.map((file, index) => <div key={`${file.name}-${index}`} className="flex aspect-square flex-col items-center justify-center rounded-2xl border bg-stone-50 p-3 text-center text-xs text-stone-600"><ImagePlus className="mb-2 size-6 text-emerald-700" /><span className="line-clamp-2">{file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="mt-2 font-bold text-red-700">Quitar</button></div>)}
                    {imageCount < 5 && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-800/25 bg-emerald-50/40 text-center text-sm font-bold text-emerald-800 hover:bg-emerald-50"><ImagePlus className="mb-2 size-7" />Agregar fotos<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => setFiles((current) => [...current, ...Array.from(e.target.files || [])].slice(0, 5 - keptMedia.length))} /></label>}
                </div>
            </section>

            <section className="form-section"><div><p className="form-kicker">Ubicación</p><h2 className="form-title">¿Dónde se encuentra?</h2><p className="mt-2 text-sm text-stone-500">Podés usar tu ubicación actual y agregar una referencia visible.</p></div><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><div className="relative"><MapPin className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" /><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Localidad, provincia" className="h-12 rounded-xl pl-12" /></div><Button type="button" variant="outline" className="h-12 rounded-full" onClick={() => navigator.geolocation?.getCurrentPosition((position) => setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }))}>{coordinates ? "Ubicación guardada" : "Usar ubicación actual"}</Button></div></section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" className="h-12 rounded-full px-7" onClick={() => router.back()}>Cancelar</Button><Button type="submit" disabled={loading} className="h-12 rounded-full bg-emerald-800 px-8">{loading ? <><Loader2 className="size-4 animate-spin" /> Guardando...</> : product ? "Guardar cambios" : "Publicar"}</Button></div>
        </form>
    );
}

function AttributeField({ attribute, value, setValue }: { attribute: AttributeDefinition; value: AttributeValue | undefined; setValue: (value: AttributeValue) => void }) {
    if (attribute.type === "boolean") return <label className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold">{attribute.label}<input type="checkbox" checked={Boolean(value)} onChange={(e) => setValue(e.target.checked)} className="size-5 accent-emerald-700" /></label>;
    if (attribute.type === "select") return <div className="space-y-2"><Label>{attribute.label}</Label><select className="form-select" value={typeof value === "string" ? value : ""} onChange={(e) => setValue(e.target.value)}><option value="">Seleccionar</option>{attribute.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>;
    if (attribute.type === "multiselect") return <div className="space-y-2"><Label>{attribute.label}</Label><select multiple className="form-select min-h-28" value={Array.isArray(value) ? value : []} onChange={(e) => setValue(Array.from(e.target.selectedOptions).map((option) => option.value))}>{attribute.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div>;
    if (attribute.type === "numberRange") {
        const range = value && typeof value === "object" && !Array.isArray(value) ? value : {};
        return <div className="space-y-2"><Label>{attribute.label}</Label><div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Mínimo" value={range.min ?? ""} onChange={(e) => setValue({ ...range, min: e.target.value ? Number(e.target.value) : undefined })} /><Input type="number" placeholder="Máximo" value={range.max ?? ""} onChange={(e) => setValue({ ...range, max: e.target.value ? Number(e.target.value) : undefined })} /></div></div>;
    }
    const scalarValue = typeof value === "string" || typeof value === "number" ? value : "";
    return <div className="space-y-2"><Label>{attribute.label}</Label><Input type={attribute.type === "number" ? "number" : "text"} value={scalarValue} onChange={(e) => setValue(attribute.type === "number" ? Number(e.target.value) : e.target.value)} placeholder={attribute.placeholder || ""} className="h-12 rounded-xl" /></div>;
}
