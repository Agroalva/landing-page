import { NextRequest, NextResponse } from "next/server";
import { getWeatherForCoordinates } from "@/lib/market-data";

export async function GET(request: NextRequest) {
    const latitude = Number(request.nextUrl.searchParams.get("latitude"));
    const longitude = Number(request.nextUrl.searchParams.get("longitude"));

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return NextResponse.json(
            { error: "Las coordenadas no son válidas." },
            { status: 400 },
        );
    }

    const weather = await getWeatherForCoordinates(
        Number(latitude.toFixed(3)),
        Number(longitude.toFixed(3)),
    );

    if (!weather.isLive) {
        return NextResponse.json(
            { error: "No pudimos consultar el clima en este momento." },
            { status: 502 },
        );
    }

    return NextResponse.json(weather, {
        headers: {
            "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
    });
}
