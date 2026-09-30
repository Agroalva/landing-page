import { AuthGate } from "@/components/marketplace/auth-gate";
import { ReviewComposer } from "@/components/marketplace/review-composer";

export default async function ReviewPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    return <AuthGate><ReviewComposer userId={userId} /></AuthGate>;
}
