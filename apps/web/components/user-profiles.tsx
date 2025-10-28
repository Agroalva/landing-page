import { Card, CardContent } from "@/components/ui/card"
import { Sprout, Truck, Wrench } from "lucide-react"

const profiles = [
  {
    icon: Sprout,
    title: "Productores",
    description: "Vendé tu producción directamente, alquilá maquinaria que no usás y accedé a insumos a mejor precio.",
    benefits: ["Venta directa", "Alquiler de equipos", "Mejores precios"],
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Truck,
    title: "Distribuidores",
    description: "Ampliá tu red de clientes, gestioná pedidos eficientemente y optimizá tu logística de distribución.",
    benefits: ["Mayor alcance", "Gestión simple", "Logística optimizada"],
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Wrench,
    title: "Prestadores de servicios",
    description: "Ofrecé tus servicios y maquinaria en alquiler. Conectá con productores que necesitan tu experiencia.",
    benefits: ["Más clientes", "Calendario organizado", "Pagos seguros"],
    color: "bg-primary/5 text-primary",
  },
]

export function UserProfiles() {
  return (
    <section className="bg-muted/50 py-24 md:py-32">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-4 font-sans text-3xl font-bold tracking-tight text-foreground text-balance md:text-5xl">
            Una plataforma para todos
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
            Sea cual sea tu rol en el agro, agroAlva tiene las herramientas que necesitás
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {profiles.map((profile, index) => (
            <Card key={index} className="border-2 transition-all hover:border-primary hover:shadow-xl">
              <CardContent className="pt-8">
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${profile.color}`}>
                  <profile.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-3 font-sans text-2xl font-bold text-card-foreground">{profile.title}</h3>
                <p className="mb-6 leading-relaxed text-muted-foreground">{profile.description}</p>
                <ul className="space-y-2">
                  {profile.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
