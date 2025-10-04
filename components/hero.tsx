"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

export function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-accent/10">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/abstract-agricultural-field-pattern-aerial-view.jpg')] bg-cover bg-center opacity-5" />

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo/Brand */}
          <div className="mb-8 flex items-center justify-center">
            <Image src="/logo.svg" alt="AGROALVA" width={280} height={80} className="h-16 w-auto md:h-20" priority />
          </div>

          {/* Hero headline */}
          <h2 className="mb-6 font-sans text-4xl font-bold leading-tight tracking-tight text-foreground text-balance md:text-6xl lg:text-7xl">
            El marketplace del agro argentino
          </h2>

          {/* Subheadline */}
          <p className="mb-8 text-xl leading-relaxed text-muted-foreground text-pretty md:text-2xl">
            Conectamos productores, distribuidores y prestadores de servicios.
            <span className="font-semibold text-primary"> Alquilá maquinaria</span>, comprá insumos y vendé tu
            producción en un solo lugar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="group h-14 px-8 text-lg font-semibold"
              onClick={() => scrollToSection("newsletter")}
            >
              Unirme a la lista de espera
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold bg-transparent"
              onClick={() => scrollToSection("funcionalidades")}
            >
              Conocer más
            </Button>
          </div>

          {/* Trust indicator */}
          <p className="mt-12 text-sm text-muted-foreground">Próximamente en toda Argentina 🇦🇷</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
