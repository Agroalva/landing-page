import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Store } from "lucide-react"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  buildProductShareUrl,
  fetchSharedProduct,
  getCanonicalSiteUrl,
  getProductShareDescription,
  IOS_STORE_URL,
  PLAY_STORE_URL,
  type ShareProduct,
} from "@/lib/product-share"

type ProductPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await fetchSharedProduct(id)

  if (!product) {
    return {
      title: "Publicación no disponible | agroAlva",
      description: "La publicación que buscás ya no está disponible en agroAlva.",
      alternates: {
        canonical: `/product/${id}`,
      },
      openGraph: {
        title: "Publicación no disponible | agroAlva",
        description: "La publicación que buscás ya no está disponible en agroAlva.",
        type: "article",
        url: `/product/${id}`,
        images: [
          {
            url: "/favicon-512.png",
            width: 512,
            height: 512,
            alt: "agroAlva",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Publicación no disponible | agroAlva",
        description: "La publicación que buscás ya no está disponible en agroAlva.",
        images: ["/favicon-512.png"],
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: `${product.name} | agroAlva`,
    description: getProductShareDescription(product),
    alternates: {
      canonical: `/product/${id}`,
    },
    openGraph: {
      title: `${product.name} | agroAlva`,
      description: getProductShareDescription(product),
      type: "article",
      url: `/product/${id}`,
      images: [
        {
          url: product.primaryImageUrl || "/favicon-512.png",
          width: 512,
          height: 512,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | agroAlva`,
      description: getProductShareDescription(product),
      images: [product.primaryImageUrl || "/favicon-512.png"],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await fetchSharedProduct(id)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f7f2_0%,#ffffff_38%,#f9faf7_100%)]">
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a agroAlva
        </Link>

        {product ? <AvailableProductView product={product} /> : <UnavailableProductView productId={id} />}
      </section>

      <Footer />
    </main>
  )
}

function AvailableProductView({ product }: { product: ShareProduct }) {
  const formattedPrice =
    product.price !== undefined ? new Intl.NumberFormat("es-AR").format(product.price) : null
  const shareUrl = buildProductShareUrl(product._id)

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(23,68,40,0.08)]">
        <div className="relative aspect-[4/3] bg-zinc-100">
          {product.primaryImageUrl ? (
            <Image src={product.primaryImageUrl} alt={product.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.15),transparent_55%),linear-gradient(135deg,#f2f7f1,#d7e6d3)]">
              <Store className="h-14 w-14 text-emerald-800/70" />
            </div>
          )}
        </div>
        <div className="space-y-5 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                {product.type === "rent" ? "Alquiler" : "Venta"}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">{product.name}</h1>
              <p className="text-sm text-zinc-500">
                Publicado el{" "}
                {new Date(product.createdAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {formattedPrice ? (
              <div className="rounded-2xl bg-emerald-950 px-5 py-4 text-right text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Precio</p>
                <p className="text-2xl font-semibold">${formattedPrice}</p>
              </div>
            ) : null}
          </div>

          {product.description ? (
            <p className="text-base leading-7 text-zinc-700">{product.description}</p>
          ) : (
            <p className="text-base leading-7 text-zinc-500">
              Esta publicación fue compartida desde la app de agroAlva.
            </p>
          )}

          <div className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2">
            {product.authorDisplayName ? (
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Publicado por</p>
                <p className="mt-2 font-medium text-zinc-900">{product.authorDisplayName}</p>
              </div>
            ) : null}
            {product.location?.label || product.location?.address ? (
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ubicación</p>
                <p className="mt-2 flex items-start gap-2 font-medium text-zinc-900">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                  <span>{product.location?.label || product.location?.address}</span>
                </p>
              </div>
            ) : null}
            {product.category ? (
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Categoría</p>
                <p className="mt-2 font-medium text-zinc-900">{product.category}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Enlace compartido</p>
              <p className="mt-2 break-all text-sm text-zinc-700">{shareUrl}</p>
            </div>
          </div>
        </div>
      </div>

      <aside className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-[0_24px_80px_rgba(23,68,40,0.08)] md:p-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Abrila en la app</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Si la app está instalada, este enlace se abre directo en agroAlva.
          </h2>
          <p className="text-base leading-7 text-zinc-600">
            Si todavía no la tenés, descargala para contactar vendedores, guardar favoritos y ver todos los detalles
            desde el celular.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Button asChild className="h-12 w-full bg-emerald-800 text-base hover:bg-emerald-900">
            <a href={getCanonicalSiteUrl()} target="_blank" rel="noreferrer">
              Abrir agroAlva
            </a>
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={IOS_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <Image src="/app-store.svg" alt="Descargar en App Store" width={160} height={48} className="h-10 w-auto" />
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <Image src="/play-store.svg" alt="Descargar en Google Play" width={160} height={48} className="h-10 w-auto" />
            </a>
          </div>
        </div>
      </aside>
    </div>
  )
}

function UnavailableProductView({ productId }: { productId: string }) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="space-y-5 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.16),transparent_48%),linear-gradient(160deg,#ffffff,#f2f6ef)] px-8 py-12 text-center md:px-14">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Publicación no disponible</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">La publicación que buscás ya no está activa.</h1>
        <p className="mx-auto max-w-xl text-base leading-7 text-zinc-600">
          Puede haberse eliminado, vencido o el enlace podría ser incorrecto. Desde la app o el sitio podés seguir
          explorando otras publicaciones.
        </p>
        <p className="text-sm text-zinc-500">ID compartido: {productId}</p>
        <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Button asChild className="h-12 bg-emerald-800 px-6 hover:bg-emerald-900">
            <Link href="/">Ir a inicio</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 px-6">
            <a href={getCanonicalSiteUrl()} target="_blank" rel="noreferrer">
              Abrir agroAlva
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
