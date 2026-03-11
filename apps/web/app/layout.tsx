import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "agroAlva - Marketplace del Agro Argentino",
  description:
    "Conectamos productores, distribuidores y prestadores de servicios. Alquilá maquinaria, comprá insumos y vendé tu producción en un solo lugar.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.agroalva.com.ar"),
  openGraph: {
    title: "agroAlva - Marketplace del Agro Argentino",
    description:
      "Conectamos productores, distribuidores y prestadores de servicios. Alquilá maquinaria, comprá insumos y vendé tu producción en un solo lugar.",
    type: "website",
    url: "/",
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
    title: "agroAlva - Marketplace del Agro Argentino",
    description:
      "Conectamos productores, distribuidores y prestadores de servicios. Alquilá maquinaria, comprá insumos y vendé tu producción en un solo lugar.",
    images: ["/favicon-512.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
