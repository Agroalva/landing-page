import { CheckCheck, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getListingStatus,
    LISTING_STATUS_LABELS,
    type ListingStatus,
} from "../../../app/config/listing-status";

export const LISTING_STATUS_STYLES: Record<ListingStatus, string> = {
    active: "bg-emerald-100 text-emerald-900",
    paused: "bg-amber-100 text-amber-900",
    sold: "bg-stone-800 text-white",
    rented: "bg-stone-800 text-white",
};

export function ListingStatusBadge({ status, className }: { status?: ListingStatus; className?: string }) {
    const resolved = getListingStatus(status);
    const Icon = resolved === "paused" ? Pause : CheckCheck;
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide", LISTING_STATUS_STYLES[resolved], className)}>
            {resolved !== "active" && <Icon className="size-3.5" />}
            {LISTING_STATUS_LABELS[resolved]}
        </span>
    );
}
