import { authClient } from "@/lib/auth-client";

export function useAuthSession() {
    const { data: session, isPending } = authClient.useSession();

    return {
        user: session?.user,
        isLoading: isPending,
        isAuthenticated: !!session?.user,
    };
}

