"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useMutation, useQuery } from "convex/react"
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Loader2, LogIn, ShieldAlert, Trash2 } from "lucide-react"
import { api } from "../../../../app/convex/_generated/api"
import type { Id } from "../../../../app/convex/_generated/dataModel"
import { authClient } from "@/lib/auth-client"
import { useAuthSession } from "@/hooks/use-auth-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

type BannerId = Id<"banners">
type StorageId = Id<"_storage">

type AdminBanner = {
  _id: BannerId
  _creationTime: number
  imageStorageId: StorageId
  imageUrl: string | null
  targetUrl?: string
  sortOrder: number
  isActive: boolean
  createdByUserId?: string
  createdAt: number
  updatedAt: number
}

function BannerMobilePreview({ imageUrl, bannerUrl }: { imageUrl: string | null; bannerUrl?: string }) {
  return (
    <div className="rounded-[2.4rem] border border-[#1f1a14]/10 bg-[linear-gradient(180deg,#f9f6ef_0%,#f4f1ea_100%)] p-3 shadow-[0_24px_60px_rgba(31,26,20,0.14)]">
      <div className="overflow-hidden rounded-[1.8rem] border border-[#e8e0d0] bg-[#fffdf8] shadow-[0_18px_50px_rgba(31,26,20,0.08)]">
        <div className="flex items-center justify-between border-b border-[#e8e0d0] px-5 py-4">
          <div className="text-[1.9rem] font-extrabold tracking-[0.01em] text-[#1b5e20]">Agroalva</div>
          <div className="rounded-full bg-[#1b5e20] px-4 py-2.5 text-[0.78rem] font-bold text-white">Iniciar sesion</div>
        </div>
        <div className="space-y-[18px] px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="text-[0.74rem] font-extrabold uppercase tracking-[0.24em] text-[#1b5e20]">Destacados</div>
            <div className="text-[0.8rem] font-semibold text-[#6a5f50]">1/1</div>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-[rgba(31,26,20,0.08)] bg-[#dce6d3]">
            <div className="relative aspect-[16/4] bg-[#eef2ea]">
              {imageUrl ? (
                <img src={imageUrl} alt="Vista previa del banner mobile" className="absolute inset-0 h-full w-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
              {bannerUrl ? (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-[rgba(8,24,16,0.72)] px-3.5 py-2 text-[0.76rem] font-semibold text-white">
                  Abrir enlace
                  <ExternalLink className="size-3.5" />
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <div className="h-2 w-5 rounded-full bg-[#1b5e20]" />
            <div className="h-2 w-2 rounded-full bg-[rgba(27,94,32,0.18)]" />
            <div className="h-2 w-2 rounded-full bg-[rgba(27,94,32,0.18)]" />
          </div>
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="text-[2rem] font-extrabold leading-none tracking-tight text-[#1f1a14]">Explora por tipo</div>
              <div className="text-[0.92rem] leading-snug text-[#6a5f50]">
                Productos fisicos o servicios, con filtros en el siguiente paso.
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e8d8] bg-[#eef7ef] px-3.5 py-2.5 text-[0.84rem] font-bold text-[#1b5e20]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              Buscar
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BannerSourcePreview({ imageUrl, index }: { imageUrl: string | null; index?: number }) {
  return (
    <div className="self-start rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,240,0.98))] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">Imagen base</div>
          <div className="mt-1 text-sm text-muted-foreground">{index ? `Banner #${index}` : "Archivo subido"}</div>
        </div>
        <div className="rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#1b5e20]">
          16:4
        </div>
      </div>
      <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-[#eef2ea] shadow-inner">
        {imageUrl ? (
          <img src={imageUrl} alt={index ? `Imagen base del banner ${index}` : "Imagen base del banner"} className="aspect-[16/4] w-full object-contain" />
        ) : (
          <div className="flex aspect-[16/4] items-center justify-center text-sm text-muted-foreground">Sin imagen</div>
        )}
      </div>
      <div className="mt-3 text-xs leading-5 text-muted-foreground">
        Esta vista muestra el archivo completo en la proporcion recomendada, sin el contexto de la pantalla mobile.
      </div>
    </div>
  )
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"]

function isValidExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

async function uploadBannerImage(file: File, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error("No se pudo subir la imagen del banner.")
  }

  const result = await response.json()
  return result.storageId as StorageId
}

export function AdminBannersClient() {
  const { isAuthenticated, isLoading, user } = useAuthSession()
  const profile = useQuery(api.users.getMe, isAuthenticated ? {} : "skip")
  const banners = useQuery(api.banners.listAdmin, profile?.role === "admin" ? {} : "skip")
  const generateBannerUploadUrl = useMutation(api.banners.generateBannerUploadUrl)
  const createBanner = useMutation(api.banners.createBanner)
  const updateBanner = useMutation(api.banners.updateBanner)
  const reorderBanners = useMutation(api.banners.reorderBanners)
  const deleteBanner = useMutation(api.banners.deleteBanner)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signInError, setSignInError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [targetUrl, setTargetUrl] = useState("")
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [savingBannerIds, setSavingBannerIds] = useState<Record<string, boolean>>({})
  const [deletingBannerIds, setDeletingBannerIds] = useState<Record<string, boolean>>({})
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>({})
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!banners) {
      return
    }

    setDraftUrls((current) => {
      const next: Record<string, string> = {}
      for (const banner of banners) {
        next[banner._id] = current[banner._id] ?? banner.targetUrl ?? ""
      }
      return next
    })
  }, [banners])

  useEffect(() => {
    if (!file) {
      setPreviewImageUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewImageUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const orderedBanners = useMemo<AdminBanner[]>(() => (banners ?? []) as AdminBanner[], [banners])
  const isAdmin = profile?.role === "admin"

  const setSaving = (bannerId: string, value: boolean) => {
    setSavingBannerIds((current) => ({ ...current, [bannerId]: value }))
  }

  const setDeleting = (bannerId: string, value: boolean) => {
    setDeletingBannerIds((current) => ({ ...current, [bannerId]: value }))
  }

  const handleSignIn = async () => {
    setSignInError(null)
    setStatusMessage(null)
    setIsSigningIn(true)

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      })

      if (error) {
        setSignInError("No se pudo iniciar sesion con esas credenciales.")
      }
    } catch {
      setSignInError("No se pudo iniciar sesion con esas credenciales.")
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    setCreateError(null)

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
      setCreateError("Subi una imagen JPG o PNG.")
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleCreateBanner = async () => {
    setCreateError(null)
    setStatusMessage(null)

    if (!file) {
      setCreateError("Selecciona una imagen para el banner.")
      return
    }

    const normalizedUrl = targetUrl.trim()
    if (normalizedUrl && !isValidExternalUrl(normalizedUrl)) {
      setCreateError("La URL debe ser externa y comenzar con http:// o https://.")
      return
    }

    setIsCreating(true)

    try {
      const uploadUrl = await generateBannerUploadUrl()
      const imageStorageId = await uploadBannerImage(file, uploadUrl)

      await createBanner({
        imageStorageId,
        targetUrl: normalizedUrl || undefined,
      })

      setFile(null)
      setFileInputKey((current) => current + 1)
      setTargetUrl("")
      setPreviewImageUrl(null)
      setStatusMessage("Banner creado correctamente.")
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No se pudo crear el banner.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveBanner = async (bannerId: BannerId, isActive: boolean) => {
    const nextUrl = (draftUrls[bannerId] ?? "").trim()

    if (nextUrl && !isValidExternalUrl(nextUrl)) {
      setStatusMessage("Cada banner debe usar una URL externa valida.")
      return
    }

    setSaving(bannerId, true)
    setStatusMessage(null)

    try {
      await updateBanner({
        bannerId,
        targetUrl: nextUrl || null,
        isActive,
      })
      setStatusMessage("Banner actualizado.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "No se pudo guardar el banner.")
    } finally {
      setSaving(bannerId, false)
    }
  }

  const handleToggleActive = async (bannerId: BannerId, checked: boolean) => {
    setSaving(bannerId, true)
    setStatusMessage(null)

    try {
      await updateBanner({
        bannerId,
        isActive: checked,
        targetUrl: (draftUrls[bannerId] ?? "").trim() || null,
      })
      setStatusMessage("Estado del banner actualizado.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "No se pudo actualizar el banner.")
    } finally {
      setSaving(bannerId, false)
    }
  }

  const handleMove = async (bannerId: BannerId, direction: "up" | "down") => {
    if (!orderedBanners.length) {
      return
    }

    const currentIndex = orderedBanners.findIndex((banner) => banner._id === bannerId)
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedBanners.length) {
      return
    }

    const nextOrder = [...orderedBanners]
    const [banner] = nextOrder.splice(currentIndex, 1)
    nextOrder.splice(targetIndex, 0, banner)

    setSaving(bannerId, true)
    setStatusMessage(null)

    try {
      await reorderBanners({
        orderedBannerIds: nextOrder.map((item) => item._id),
      })
      setStatusMessage("Orden de banners actualizado.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "No se pudo reordenar.")
    } finally {
      setSaving(bannerId, false)
    }
  }

  const handleDelete = async (bannerId: BannerId) => {
    setDeleting(bannerId, true)
    setStatusMessage(null)

    try {
      await deleteBanner({ bannerId })
      setStatusMessage("Banner eliminado.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "No se pudo eliminar el banner.")
    } finally {
      setDeleting(bannerId, false)
    }
  }

  if (isLoading || (isAuthenticated && profile === undefined)) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-border/60 bg-card/90 p-16 shadow-sm">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-border/60 bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Ingresar al panel de banners</CardTitle>
            <CardDescription>
              Usa una cuenta con rol admin para gestionar los banners del inicio mobile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Contrasena
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {signInError ? <p className="text-sm text-destructive">{signInError}</p> : null}
            <Button className="w-full" onClick={handleSignIn} disabled={isSigningIn}>
              {isSigningIn ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Ingresar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-amber-300/70 bg-amber-50/90 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 text-amber-900">
              <ShieldAlert className="size-5" />
              <CardTitle>Acceso restringido</CardTitle>
            </div>
            <CardDescription className="text-amber-900/80">
              La cuenta {user?.email ?? "actual"} no tiene rol admin en Convex.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="rounded-[2rem] border border-emerald-950/10 bg-[radial-gradient(circle_at_top_left,rgba(27,94,32,0.16),transparent_32%),linear-gradient(135deg,rgba(255,253,248,0.96),rgba(243,247,238,0.98))] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">Admin dashboard</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Banners del home mobile</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Carga imagenes, define enlaces externos y controla el orden del carrusel sin afectar a clientes viejos.
            </p>
          </div>
          <Button variant="outline" onClick={() => authClient.signOut()}>
            Cerrar sesion
          </Button>
        </div>
      </section>

      <Card className="border-border/60 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Nuevo banner</CardTitle>
          <CardDescription>
            Recomendado: imagen horizontal, hasta 5 MB, formato JPG o PNG. La URL debe ser externa.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.1fr_1fr_auto] md:items-end">
          <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950 md:col-span-3">
            Usa una composicion panoramica. Referencia recomendada: proporcion 16:4, minimo 1600 x 400 px; ideal 2400 x 600 px para mejor nitidez en pantallas modernas. Mantiene el contenido importante centrado porque el banner se muestra mas bajo en mobile.
          </div>
          <div className="md:col-span-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">Vista previa en la app</div>
            <div className="mx-auto max-w-[24rem]">
              <BannerMobilePreview imageUrl={previewImageUrl} bannerUrl={targetUrl.trim() || undefined} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="banner-file">
              Imagen
            </label>
            <Input
              key={fileInputKey}
              id="banner-file"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
            />
            {file ? <p className="text-xs text-muted-foreground">{file.name}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="banner-url">
              URL externa
            </label>
            <Input
              id="banner-url"
              placeholder="https://ejemplo.com/campana"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
            />
          </div>
          <Button className="min-w-44" onClick={handleCreateBanner} disabled={isCreating}>
            {isCreating ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            Crear banner
          </Button>
          {createError ? <p className="text-sm text-destructive md:col-span-3">{createError}</p> : null}
          {statusMessage ? <p className="text-sm text-muted-foreground md:col-span-3">{statusMessage}</p> : null}
        </CardContent>
      </Card>

      <section className="grid gap-4">
        {banners === undefined ? (
          <Card className="border-border/60 bg-card/95 p-8 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando banners...
            </div>
          </Card>
        ) : orderedBanners.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-card/80 p-8 text-sm text-muted-foreground shadow-sm">
            Aun no hay banners. El primero que crees se mostrara al inicio del carrusel mobile.
          </Card>
        ) : (
          orderedBanners.map((banner: (typeof orderedBanners)[number], index: number) => {
            const bannerUrl = draftUrls[banner._id] ?? banner.targetUrl ?? ""
            const isSaving = !!savingBannerIds[banner._id]
            const isDeleting = !!deletingBannerIds[banner._id]

            return (
              <Card key={banner._id} className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
                <CardContent className="p-6">
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,380px)_minmax(0,1fr)] xl:items-start">
                    <BannerSourcePreview imageUrl={banner.imageUrl} index={index + 1} />

                    <div className="self-start">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">Como se vera en la app</div>
                      <div className="max-w-[24rem]">
                        <BannerMobilePreview imageUrl={banner.imageUrl} bannerUrl={bannerUrl || undefined} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-5 self-start rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,240,0.98))] p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                            Banner #{index + 1}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Orden actual: {banner.sortOrder + 1}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleMove(banner._id, "up")}
                            disabled={index === 0 || isSaving}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleMove(banner._id, "down")}
                            disabled={index === orderedBanners.length - 1 || isSaving}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(banner._id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground" htmlFor={`banner-url-${banner._id}`}>
                            URL externa
                          </label>
                          <Input
                            id={`banner-url-${banner._id}`}
                            value={bannerUrl}
                            placeholder="https://ejemplo.com/campana"
                            onChange={(event) =>
                              setDraftUrls((current) => ({
                                ...current,
                                [banner._id]: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Activo</p>
                            <p className="text-xs text-muted-foreground">Visible en el carrusel mobile</p>
                          </div>
                          <Switch
                            checked={banner.isActive}
                            disabled={isSaving}
                            onCheckedChange={(checked) => handleToggleActive(banner._id, checked)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="button" onClick={() => handleSaveBanner(banner._id, banner.isActive)} disabled={isSaving}>
                          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                          Guardar cambios
                        </Button>
                        {banner.targetUrl ? (
                          <a
                            href={banner.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="size-4" />
                            Abrir URL actual
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin enlace configurado.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </section>
    </div>
  )
}
