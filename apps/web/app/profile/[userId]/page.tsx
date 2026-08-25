import { PublicProfile } from "@/components/marketplace/public-profile";
export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) { const { userId } = await params; return <PublicProfile userId={userId} />; }
