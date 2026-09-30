"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
    value: number;
    onChange?: (value: number) => void;
    size?: "sm" | "md" | "lg";
    showValue?: boolean;
    reviewCount?: number;
    className?: string;
};

const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-8",
};

export function StarRating({
    value,
    onChange,
    size = "md",
    showValue = false,
    reviewCount,
    className,
}: StarRatingProps) {
    const normalizedValue = Math.max(0, Math.min(5, value));
    const interactive = Boolean(onChange);

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            <div
                className="flex items-center gap-0.5"
                aria-label={`${normalizedValue.toFixed(1)} de 5 estrellas`}
                role={interactive ? undefined : "img"}
            >
                {[1, 2, 3, 4, 5].map((star) => {
                    const fill = Math.max(0, Math.min(1, normalizedValue - star + 1)) * 100;
                    if (interactive) {
                        return (
                            <button
                                key={star}
                                type="button"
                                className="rounded-sm p-0.5 text-amber-400 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                                onClick={() => onChange?.(star)}
                                aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                                aria-pressed={normalizedValue === star}
                            >
                                <Star className={cn(sizeClasses[size], star <= normalizedValue ? "fill-current" : "fill-transparent text-stone-300")} />
                            </button>
                        );
                    }

                    return (
                        <span key={star} className={cn("relative block", sizeClasses[size])} aria-hidden="true">
                            <Star className="absolute inset-0 size-full text-stone-300" />
                            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
                                <Star className={cn("fill-amber-400 text-amber-400", sizeClasses[size])} />
                            </span>
                        </span>
                    );
                })}
            </div>
            {showValue && <span className="font-black text-stone-900">{normalizedValue.toFixed(1)}</span>}
            {reviewCount !== undefined && (
                <span className="text-sm text-stone-500">
                    ({reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"})
                </span>
            )}
        </div>
    );
}
