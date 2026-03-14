export type ShareProduct = {
  _id: string
  name: string
  description?: string
  price?: number
  currency?: string
  type: "rent" | "sell"
  category?: string
  familyId?: string
  categoryId?: string
  location?: {
    address?: string
    label?: string
  }
  createdAt: number
  primaryImageUrl?: string
  authorDisplayName?: string
}

const DEFAULT_WEB_URL = "https://www.agroalva.com.ar"
const DEFAULT_CONVEX_URL = process.env.CONVEX_SITE_URL?.trim()
export const IOS_STORE_URL = "https://apps.apple.com/ar/app/agroalva-s-a-s/id6742560806?l=en-GB"
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=syloper.agroalva.app"

export const getCanonicalSiteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_WEB_URL).replace(/\/+$/, "")

const getShareEndpointBaseUrl = () => {
  if (!DEFAULT_CONVEX_URL) {
    return null
  }

  return DEFAULT_CONVEX_URL.replace(/\/+$/, "")
}

export const buildProductShareUrl = (productId: string) => `${getCanonicalSiteUrl()}/product/${productId}`

const buildProductShareDescription = (product: ShareProduct) => {
  const trimmedDescription = product.description?.trim()
  if (trimmedDescription) {
    return trimmedDescription.slice(0, 160)
  }

  if (product.price !== undefined) {
    const formattedPrice = new Intl.NumberFormat("es-AR").format(product.price)
    return `${product.type === "rent" ? "Alquiler" : "Venta"} disponible por $${formattedPrice}.`
  }

  return "Abrí esta publicación en agroAlva."
}

export const getProductShareDescription = (product: ShareProduct) => buildProductShareDescription(product)

export async function fetchSharedProduct(productId: string): Promise<ShareProduct | null> {
  const baseUrl = getShareEndpointBaseUrl()
  if (!baseUrl) {
    return null
  }

  const response = await fetch(`${baseUrl}/public/product-share?id=${encodeURIComponent(productId)}`, {
    cache: "no-store",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch shared product: ${response.status}`)
  }

  return (await response.json()) as ShareProduct
}
