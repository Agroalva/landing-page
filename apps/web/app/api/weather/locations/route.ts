import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "5");

    if (query.length === 1 || query.length > 80) {
        return NextResponse.json(
            { error: "La búsqueda debe estar vacía o tener entre 2 y 80 caracteres." },
            { status: 400 },
        );
    }

    if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > 1000 ||
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 10
    ) {
        return NextResponse.json(
            { error: "La paginación no es válida." },
            { status: 400 },
        );
    }

    const convexSiteUrl = (
        process.env.CONVEX_SITE_URL ||
        process.env.NEXT_PUBLIC_CONVEX_SITE_URL
    )?.trim().replace(/\/+$/, "");

    if (!convexSiteUrl) {
        return NextResponse.json(
            { error: "El servicio de ubicaciones todavía no está configurado." },
            { status: 503 },
        );
    }

    const searchParams = new URLSearchParams({
        catalog: "georef-v1",
        q: query,
        page: page.toString(),
        pageSize: pageSize.toString(),
    });

    try {
        const response = await fetch(
            `${convexSiteUrl}/public/weather-locations?${searchParams}`,
            {
                next: { revalidate: 86400 },
                signal: AbortSignal.timeout(8000),
            },
        );
        const data = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
            return NextResponse.json(
                data ?? { error: "No pudimos buscar ubicaciones en este momento." },
                { status: response.status },
            );
        }

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
            },
        });
    } catch {
        return NextResponse.json(
            { error: "No pudimos buscar ubicaciones en este momento." },
            { status: 502 },
        );
    }
}
