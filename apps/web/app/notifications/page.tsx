import { AuthGate } from "@/components/marketplace/auth-gate";
import { NotificationCenter } from "@/components/marketplace/notification-center";
export default function NotificationsPage() { return <AuthGate><main className="min-h-screen"><div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Novedades</p><h1 className="mt-2 text-4xl font-black">Notificaciones</h1><div className="mt-7"><NotificationCenter /></div></div></main></AuthGate>; }
