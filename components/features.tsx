import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Search, MessageCircle, MapPin } from "lucide-react"

const features = [
  {
    icon: ShoppingCart,
    title: "Marketplace completo",
    description:
      "Comprá, vendé y alquilá insumos, maquinaria, productos agrícolas y más. Todo en una plataforma segura y confiable.",
  },
  {
    icon: Search,
    title: "Búsqueda inteligente",
    description:
      "Encontrá exactamente lo que necesitás con filtros avanzados por categoría, ubicación, precio y disponibilidad.",
  },
  {
    icon: MessageCircle,
    title: "Chat directo",
    description:
      "Comunicate directamente con vendedores y compradores. Negociá precios y coordiná entregas en tiempo real.",
  },
  {
    icon: MapPin,
    title: "Geolocalización",
    description: "Descubrí proveedores y servicios cerca tuyo. Optimizá logística y reducí costos de transporte.",
  },
]

export function Features() {
  return (
    <section className="py-24 md:py-32" id="funcionalidades">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-4 font-sans text-3xl font-bold tracking-tight text-foreground text-balance md:text-5xl">
            Todo lo que necesitás para tu negocio agrícola
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
            Una plataforma diseñada específicamente para las necesidades del campo argentino
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="pt-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 font-sans text-xl font-bold text-card-foreground">{feature.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
