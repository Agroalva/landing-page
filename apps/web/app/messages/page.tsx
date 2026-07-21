import { AuthGate } from "@/components/marketplace/auth-gate";
import { ConversationList } from "@/components/marketplace/conversation-list";
export default function MessagesPage() { return <AuthGate><main className="min-h-screen"><div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Conversaciones</p><h1 className="mt-2 mb-8 text-4xl font-black">Mensajes</h1><ConversationList /></div></main></AuthGate>; }
