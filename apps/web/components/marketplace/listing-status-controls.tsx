"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCheck, Pause, Play } from "lucide-react";
import { api, type Id } from "@/lib/convex-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    getListingStatusTransitions,
    type ListingStatus,
    type ListingStatusTransition,
} from "../../../app/config/listing-status";

const TRANSITION_ICONS: Record<ListingStatus, typeof Play> = {
    active: Play,
    paused: Pause,
    sold: CheckCheck,
    rented: CheckCheck,
};

type ListingStatusControlsProps = {
    productId: string;
    type: "rent" | "sell";
    status?: ListingStatus;
    size?: "sm" | "lg";
    className?: string;
};

export function ListingStatusControls({ productId, type, status, size = "sm", className }: ListingStatusControlsProps) {
    const updateStatus = useMutation(api.products.updateStatus);
    const [pendingStatus, setPendingStatus] = useState<ListingStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const transitions = getListingStatusTransitions(type, status);

    const apply = async (transition: ListingStatusTransition) => {
        if (transition.confirmTitle && !window.confirm(`${transition.confirmTitle}\n\n${transition.confirmMessage ?? ""}`)) {
            return;
        }
        setError(null);
        setPendingStatus(transition.status);
        try {
            await updateStatus({ productId: productId as Id<"products">, status: transition.status });
        } catch {
            setError("No se pudo actualizar la publicación. Intentá de nuevo.");
        } finally {
            setPendingStatus(null);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className={cn("flex gap-2", size === "lg" && "flex-col")}>
                {transitions.map((transition, index) => {
                    const Icon = TRANSITION_ICONS[transition.status];
                    const isPrimary = index === 0;
                    return (
                        <Button
                            key={transition.status}
                            type="button"
                            variant={isPrimary ? "default" : "outline"}
                            className={cn(
                                "flex-1 rounded-full",
                                size === "lg" ? "h-12 w-full" : "h-10 text-sm",
                                isPrimary && "bg-emerald-800 hover:bg-emerald-900",
                                !isPrimary && "border-emerald-800/30 text-emerald-900",
                            )}
                            onClick={() => apply(transition)}
                            disabled={pendingStatus !== null}
                        >
                            <Icon className="size-4" />
                            {pendingStatus === transition.status ? "Guardando..." : transition.label}
                        </Button>
                    );
                })}
            </div>
            {error && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
        </div>
    );
}
