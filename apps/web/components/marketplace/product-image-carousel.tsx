"use client";

import Image from "next/image";
import { Images } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

type ProductImageCarouselProps = {
    imageUrls: string[];
    productName: string;
};

export function ProductImageCarousel({ imageUrls, productName }: ProductImageCarouselProps) {
    const slides = imageUrls.length > 0 ? imageUrls : [""];
    const hasMultipleImages = slides.length > 1;

    return (
        <Carousel
            opts={{ loop: hasMultipleImages }}
            className="overflow-hidden rounded-[2rem] bg-stone-100 shadow-[0_20px_70px_rgba(31,55,39,0.12)]"
            aria-label={`Fotos de ${productName}`}
        >
            <CarouselContent className="ml-0">
                {slides.map((url, index) => (
                    <CarouselItem key={`${url}-${index}`} className="pl-0">
                        <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                            {url ? (
                                <Image
                                    src={url}
                                    alt={`${productName}, imagen ${index + 1}`}
                                    fill
                                    className="object-contain"
                                    sizes="(min-width: 1280px) 760px, (min-width: 1024px) 65vw, 100vw"
                                    unoptimized
                                    priority={index === 0}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-emerald-900/40">
                                    <Images className="size-14" />
                                </div>
                            )}
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>

            {hasMultipleImages ? (
                <>
                    <CarouselPrevious className="left-4 z-10 size-11 border-white/70 bg-white/90 shadow-lg hover:bg-white disabled:opacity-40" />
                    <CarouselNext className="right-4 z-10 size-11 border-white/70 bg-white/90 shadow-lg hover:bg-white disabled:opacity-40" />
                </>
            ) : null}

            {imageUrls.length > 0 ? (
                <span className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full bg-black/65 px-4 py-2 text-sm font-bold text-white">
                    {imageUrls.length} {imageUrls.length === 1 ? "foto" : "fotos"}
                </span>
            ) : null}
        </Carousel>
    );
}
