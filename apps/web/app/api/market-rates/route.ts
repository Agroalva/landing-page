import { NextResponse } from "next/server";
import { getMarketRates } from "@/lib/market-data";

export async function GET() {
    const { grains, dollars } = await getMarketRates();

    return NextResponse.json(
        {
            grains: grains.isLive ? grains : { ...grains, prices: [] },
            dollars: dollars.isLive ? dollars : { ...dollars, rates: [] },
        },
        {
            headers: {
                "Cache-Control": "public, s-maxage=900, stale-while-revalidate=900",
            },
        },
    );
}
