"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Apple, Smartphone } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSubmitted(true)
        setEmail("")
        setName("")
      } else {
        setError(data.error || 'Hubo un error al procesar tu solicitud')
      }
    } catch (error) {
      console.error('Newsletter signup error:', error)
      setError('Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-24 md:py-32" id="newsletter">
      <div className="container px-4 mx-auto max-w-7xl">
        <Card className="mx-auto max-w-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8 md:p-12">
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            {!isSubmitted ? (
              <>
                <h2 className="mb-4 text-center font-sans text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
                  Sumate a la lista de espera
                </h2>
                <p className="mb-8 text-center text-lg leading-relaxed text-muted-foreground text-pretty">
                  Sé de los primeros en acceder a agroAlva. Te avisaremos cuando estemos listos para lanzar.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 text-base"
                    />
                    <Input
                      type="email"
                      placeholder="Tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 text-base"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading}
                    className="h-12 w-full text-base font-semibold"
                  >
                    {isLoading ? 'Procesando...' : 'Unirme ahora'}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  No spam. Solo novedades importantes sobre el lanzamiento.
                </p>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-center font-sans text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
                  ¡Gracias por unirte!
                </h2>
                <p className="mb-8 text-center text-lg leading-relaxed text-muted-foreground text-pretty">
                  Ya puedes descargar agroAlva desde las tiendas oficiales.
                </p>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Button
                      asChild
                      size="lg"
                      className="h-16 w-full text-base font-semibold bg-black hover:bg-gray-800"
                    >
                      <a
                        href="https://apps.apple.com/app/agroalva"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3"
                      >
                        <Apple className="h-6 w-6" />
                        <div className="text-left">
                          <div className="text-xs">Descargar en</div>
                          <div className="text-sm font-semibold">App Store</div>
                        </div>
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      className="h-16 w-full text-base font-semibold bg-green-600 hover:bg-green-700"
                    >
                      <a
                        href="https://play.google.com/store/apps/details?id=com.agroalva"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3"
                      >
                        <Smartphone className="h-6 w-6" />
                        <div className="text-left">
                          <div className="text-xs">Descargar en</div>
                          <div className="text-sm font-semibold">Google Play</div>
                        </div>
                      </a>
                    </Button>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  ¡Disfruta de la mejor experiencia agrícola!
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
