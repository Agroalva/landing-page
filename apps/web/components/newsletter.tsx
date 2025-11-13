"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Image from "next/image"

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

      if (!response.ok) {
        // Try to parse error response, but handle if it's not JSON
        let errorMessage = 'Hubo un error al procesar tu solicitud'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        setError(errorMessage)
        return
      }

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
                  <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <a
                      href="https://apps.apple.com/ar/app/agroalva-s-a-s/id6742560806?l=en-GB"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/app-store.svg"
                        alt="Descargar en App Store"
                        width={120}
                        height={40}
                        className="h-10 w-auto"
                      />
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=syloper.agroalva.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/play-store.svg"
                        alt="Descargar en Google Play"
                        width={120}
                        height={40}
                        className="h-10 w-auto"
                      />
                    </a>
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
