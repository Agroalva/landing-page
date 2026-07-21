import { AuthGate } from "@/components/marketplace/auth-gate";
import { Chat } from "@/components/marketplace/chat";
export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AuthGate><main className="bg-[#f7f6ef] px-3 py-5 sm:px-6"><Chat conversationId={id} /></main></AuthGate>; }
