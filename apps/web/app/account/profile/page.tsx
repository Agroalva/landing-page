import { AuthGate } from "@/components/marketplace/auth-gate";
import { ProfileForm } from "@/components/marketplace/profile-form";
export default function AccountProfilePage() { return <AuthGate><main className="min-h-screen"><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6"><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Mi cuenta</p><h1 className="mt-2 mb-8 text-4xl font-black">Editar perfil</h1><ProfileForm /></div></main></AuthGate>; }
