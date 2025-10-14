import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { UserProfiles } from "@/components/user-profiles"
import { Testimonials } from "@/components/testimonials"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <UserProfiles />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  )
}
