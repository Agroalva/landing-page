import type { Metadata } from "next"
import Link from "next/link"

type ProductPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: "Publicación en agroAlva",
    description: "Ver publicación en agroAlva",
    alternates: {
      canonical: `/product/${id}`,
    },
    openGraph: {
      title: "Publicación en agroAlva",
      description: "Abrí esta publicación en agroAlva.",
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
      title: "Publicación en agroAlva",
      description: "Abrí esta publicación en agroAlva.",
      images: ["/favicon-512.png"],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Publicación de agroAlva</h1>
        <p className="mt-3 text-zinc-600">
          Esta publicación fue compartida desde la app. Si tenés la app instalada, abrila para ver todos los detalles.
        </p>
        <p className="mt-3 text-sm text-zinc-500">ID: {id}</p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800"
          >
            Ir a agroAlva
          </Link>
        </div>
      </div>
    </main>
  )
}
