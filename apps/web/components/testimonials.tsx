import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"


const testimonials = [
  {
    quote:
      "Publiqué mi perfil en Agroalva y en pocos días me contactaron productores de la zona. Gracias a la app conseguí nuevos trabajos y pude ampliar mis servicios. Muy fácil de usar y con gente seria del campo, ¡la recomiendo!",
    author: "Martín López",
    role: "Contratista rural",
    location: "Santiago del Estero",
  },
  {
    quote:
      "Excelente app, encontras solución en todo lo que buscas referido al campo en una sola plataforma. Lo que más me gusto fue la sección de personal.",
    author: "Giselle Gonzalez",
    role: "Productora agropecuaria",
    location: "Chaco",
  },
  {
    quote:
      "Gracias a Agroalva conseguí trabajo en menos de una semana. Publiqué mi servicio de fumigación y enseguida me contactaron productores de la zona. La app es muy práctica y fácil de usar.",
    author: "Julián Romero",
    role: "Prestador de servicios agrícolas",
    location: "Santa Fe",
  },
  {
    quote:
      "Desde que uso la app, llego a muchos más clientes. Antes mis publicaciones quedaban solo en grupos, pero ahora tengo una vidriera mucho más grande. ¡Realmente me ayudó a crecer!",
    author: "Marcos Benítez",
    role: "Vendedor de insumos",
    location: "Chaco",
  },
  {
    quote:
      "La nueva versión de Agroalva está excelente. Todo es más rápido, ordenado y fácil de manejar. Es una herramienta clave para quienes trabajamos en el campo.",
    author: "Carolina López",
    role: "Productora agropecuaria",
    location: "Córdoba",
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Conocé las experiencias de quienes ya forman parte de la comunidad Agroalva
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative bg-background/50 backdrop-blur border-muted hover:shadow-lg transition-all duration-300 hover:border-primary/20">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <Quote className="h-8 w-8 text-primary/30" />
                </div>
                <blockquote className="mb-6 text-muted-foreground leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t pt-4">
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

