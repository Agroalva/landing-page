"use client";

import { useQuery } from "convex/react";
import { CheckCheck, Pause } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { cn } from "@/lib/utils";
import {
    getListingStatus,
    LISTING_STATUS_LABELS,
    LISTING_STATUS_OWNER_MESSAGES,
    LISTING_STATUS_VISITOR_MESSAGES,
    type ListingStatus,
} from "../../../app/config/listing-status";

/**
 * The product page is server-rendered from a cached endpoint, so the status it
 * receives can be up to a minute old. Subscribe to the live value so the banner
 * and the actions react immediately when the author changes it.
 */
export function useLiveListingStatus(productId: string, initialStatus?: ListingStatus): ListingStatus {
    const product = useQuery(api.marketplace.getProduct, { productId: productId as Id<"products"> });
    return getListingStatus(product?.status ?? initialStatus);
}

export function ProductStatusBanner({ productId, authorId, initialStatus }: { productId: string; authorId: string; initialStatus?: ListingStatus }) {
    const status = useLiveListingStatus(productId, initialStatus);
    const { user } = useAuthSession();

    if (status === "active") return null;

    const isOwner = user?.id === authorId;
    const Icon = status === "paused" ? Pause : CheckCheck;

    return (
        <div
            role="status"
            className={cn(
                "mb-6 flex items-start gap-4 rounded-3xl p-5",
                status === "paused" ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200" : "bg-stone-900 text-white",
            )}
        >
            <Icon className="mt-0.5 size-7 shrink-0" />
            <div>
                <p className="text-xl font-black uppercase tracking-wide">{LISTING_STATUS_LABELS[status]}</p>
                <p className={cn("mt-1 text-sm leading-6", status === "paused" ? "text-amber-900" : "text-stone-200")}>
                    {isOwner ? LISTING_STATUS_OWNER_MESSAGES[status] : LISTING_STATUS_VISITOR_MESSAGES[status]}
                </p>
            </div>
        </div>
    );
}
