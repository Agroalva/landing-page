import { redirect } from "next/navigation";

type MarketplaceRedirectProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketplacePage({ searchParams }: MarketplaceRedirectProps) {
    const params = await searchParams;
    const next = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => next.append(key, item));
        } else if (value) {
            next.set(key, value);
        }
    });

    redirect(`/${next.size ? `?${next}` : ""}#catalogo`);
}
