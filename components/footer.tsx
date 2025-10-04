import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container px-4 py-12 md:py-16 mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Image src="/logo.svg" alt="AGROALVA" width={180} height={50} className="h-10 w-auto" />
            </div>
            <p className="mb-6 max-w-md leading-relaxed text-muted-foreground">
              El marketplace que conecta al agro argentino. Comprá, vendé y alquilá maquinaria en una plataforma
              diseñada para vos.
            </p>
            <div className="flex gap-3">
              <Button size="icon" variant="outline" className="h-10 w-10 bg-transparent">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Button>
              <Button size="icon" variant="outline" className="h-10 w-10 bg-transparent">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Button>
              <Button size="icon" variant="outline" className="h-10 w-10 bg-transparent">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Button>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-sans text-lg font-bold text-foreground">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <a href="mailto:info@agroalva.com" className="hover:text-foreground transition-colors">
                  info@agroalva.com.ar
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Las Breñas, Chaco, Argentina</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-sans text-lg font-bold text-foreground">Enlaces</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sobre nosotros
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} agroAlva. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
