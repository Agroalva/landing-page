import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useConvexAuth } from "convex/react";

const AUTH_BOOT_TIMEOUT_MS = 2500;

export function useAuthSession() {
    const { data: session, isPending } = authClient.useSession();
    const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
    const [hasTimedOut, setHasTimedOut] = useState(false);

    useEffect(() => {
        if (!isPending && !isConvexLoading) {
            setHasTimedOut(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            setHasTimedOut(true);
        }, AUTH_BOOT_TIMEOUT_MS);

        return () => clearTimeout(timeoutId);
    }, [isPending, isConvexLoading]);

    const isBootLoading = isPending || isConvexLoading;

    return {
        user: session?.user,
        isLoading: hasTimedOut ? false : isBootLoading,
        // Only consider authenticated when BOTH Better Auth AND Convex are ready
        isAuthenticated: !!session?.user && isConvexAuthenticated,
        didTimeout: hasTimedOut && isBootLoading,
    };
}
