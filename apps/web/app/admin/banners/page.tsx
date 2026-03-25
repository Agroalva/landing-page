import { AdminBannersClient } from "@/app/admin/banners/admin-banners-client"

export const dynamic = "force-dynamic"

export default function AdminBannersPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2e7_0%,#eef5ea_100%)] px-6 py-10">
      <AdminBannersClient />
    </main>
  )
}
