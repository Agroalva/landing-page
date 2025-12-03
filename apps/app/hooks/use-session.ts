import { authClient } from "@/lib/auth-client";
import { useConvexAuth } from "convex/react";

export function useAuthSession() {
    const { data: session, isPending } = authClient.useSession();
    const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexLoading } = useConvexAuth();

    return {
        user: session?.user,
        isLoading: isPending || isConvexLoading,
        // Only consider authenticated when BOTH Better Auth AND Convex are ready
        isAuthenticated: !!session?.user && isConvexAuthenticated,
    };
}

