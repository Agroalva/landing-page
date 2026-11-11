import { AuthGate } from "@/components/marketplace/auth-gate";
import { SavedSearchList } from "@/components/marketplace/saved-search-list";

export default function SavedSearchesPage() {
    return (
        <AuthGate>
            <main className="min-h-screen">
                <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Mi actividad</p>
                    <h1 className="mt-2 text-4xl font-black">Búsquedas guardadas</h1>
                    <p className="mt-2 text-stone-600">Te avisamos cuando se publique algo que coincida con estas búsquedas.</p>
                    <div className="mt-7"><SavedSearchList /></div>
                </div>
            </main>
        </AuthGate>
    );
}
