"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with Mailchimp/ConvertKit
    console.log("Newsletter signup:", { name, email })
    alert("¡Gracias por unirte a la lista de espera!")
    setEmail("")
    setName("")
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

            <h2 className="mb-4 text-center font-sans text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
              Sumate a la lista de espera
            </h2>
            <p className="mb-8 text-center text-lg leading-relaxed text-muted-foreground text-pretty">
              Sé de los primeros en acceder a agroAlva. Te avisaremos cuando estemos listos para lanzar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 text-base"
                />
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold">
                Unirme ahora
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              No spam. Solo novedades importantes sobre el lanzamiento.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
