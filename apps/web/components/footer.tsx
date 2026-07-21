import { Mail, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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

          <div>
            <h3 className="mb-4 font-sans text-lg font-bold text-foreground">Enlaces</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ayuda y seguridad</Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Términos y condiciones</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Política de privacidad</Link>
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
