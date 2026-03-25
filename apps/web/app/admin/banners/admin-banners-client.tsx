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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

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
      setCreateError("Subi una imagen JPG, PNG o WEBP.")
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
            Recomendado: imagen horizontal, hasta 5 MB, formato JPG, PNG o WEBP. La URL debe ser externa.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="banner-file">
              Imagen
            </label>
            <Input
              key={fileInputKey}
              id="banner-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
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
                <CardContent className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={`Banner ${index + 1}`}
                        className="aspect-[16/7] h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/7] items-center justify-center text-sm text-muted-foreground">
                        Imagen no disponible
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-5">
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
                </CardContent>
              </Card>
            )
          })
        )}
      </section>
    </div>
  )
}
