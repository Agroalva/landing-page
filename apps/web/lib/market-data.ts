const DEFAULT_WEATHER_LOCATION = {
    latitude: -27.08819,
    longitude: -61.08217,
};
const GRAIN_URL =
    "https://www.bcr.com.ar/es/mercados/mercado-de-granos/cotizaciones/cotizaciones-locales-0";
const DOLLAR_URL = "https://dolarapi.com/v1/dolares";

const FALLBACK_GRAINS = [
    { label: "Soja", value: 521500 },
    { label: "Maíz", value: 266710 },
    { label: "Trigo", value: 335250 },
];

const FALLBACK_DOLLARS = [
    { label: "Oficial", value: 1530 },
    { label: "Mayorista", value: 1510 },
    { label: "MEP", value: 1543.4 },
    { label: "CCL", value: 1600.6 },
    { label: "Blue", value: 1565 },
    { label: "Cripto", value: 1596.44 },
    { label: "Tarjeta", value: 1989 },
];

type DollarApiRate = {
    casa?: string;
    venta?: number;
    fechaActualizacion?: string;
};

export type MarketPulseData = {
    weather: {
        temperature: number | null;
        condition: string | null;
        maximum: number | null;
        minimum: number | null;
        humidity: number | null;
        wind: string | null;
        updatedAt: string | null;
        isLive: boolean;
    };
    grains: {
        prices: Array<{ label: string; value: number }>;
        tradingDate: string | null;
        isLive: boolean;
    };
    dollars: {
        rates: Array<{ label: string; value: number }>;
        updatedAt: string | null;
        isLive: boolean;
    };
};

function decodeCell(value: string) {
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&aacute;/g, "á")
        .replace(/&iacute;/g, "í")
        .replace(/\s+/g, " ")
        .trim();
}

function parseArgentineNumber(value: string) {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
        throw new Error("Invalid Argentine number");
    }

    return parsed;
}

export async function getWeatherForCoordinates(
    latitude: number,
    longitude: number,
): Promise<MarketPulseData["weather"]> {
    try {
        const convexSiteUrl = (
            process.env.CONVEX_SITE_URL ||
            process.env.NEXT_PUBLIC_CONVEX_SITE_URL
        )?.trim().replace(/\/+$/, "");

        if (!convexSiteUrl) {
            throw new Error("Convex site URL is not configured");
        }

        const searchParams = new URLSearchParams({
            latitude: latitude.toFixed(3),
            longitude: longitude.toFixed(3),
        });
        const response = await fetch(`${convexSiteUrl}/public/weather?${searchParams}`, {
            next: { revalidate: 900 },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            throw new Error(`Convex weather endpoint returned ${response.status}`);
        }

        const data = (await response.json()) as MarketPulseData["weather"];

        if (
            !data.isLive ||
            typeof data.temperature !== "number" ||
            typeof data.condition !== "string" ||
            typeof data.maximum !== "number" ||
            typeof data.minimum !== "number" ||
            typeof data.humidity !== "number" ||
            typeof data.wind !== "string"
        ) {
            throw new Error("Convex weather response is incomplete");
        }

        return data;
    } catch {
        return {
            temperature: null,
            condition: null,
            maximum: null,
            minimum: null,
            humidity: null,
            wind: null,
            updatedAt: null,
            isLive: false,
        };
    }
}

async function getGrains(): Promise<MarketPulseData["grains"]> {
    try {
        const response = await fetch(GRAIN_URL, {
            next: { revalidate: 21600 },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            throw new Error(`BCR returned ${response.status}`);
        }

        const html = await response.text();
        const table = html.match(/Precios C[aá]mara Arbitral[\s\S]*?<table[\s\S]*?<\/table>/i)?.[0];

        if (!table) {
            throw new Error("BCR price table was not found");
        }

        const headingCells = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => decodeCell(match[1]));
        const tradingDate = headingCells.find((cell) => /^\d{2}\/\d{2}\/\d{4}$/.test(cell)) ?? null;
        const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
        const requestedLabels = ["Soja", "Maíz", "Trigo"];

        const prices = requestedLabels.map((label) => {
            const row = rows.find((candidate) => {
                const cells = [...candidate[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => decodeCell(match[1]));
                return cells[0] === label;
            });

            if (!row) {
                throw new Error(`BCR row not found for ${label}`);
            }

            const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => decodeCell(match[1]));
            return { label, value: parseArgentineNumber(cells[2] ?? "") };
        });

        return { prices, tradingDate, isLive: true };
    } catch {
        return { prices: FALLBACK_GRAINS, tradingDate: null, isLive: false };
    }
}

async function getDollars(): Promise<MarketPulseData["dollars"]> {
    try {
        const response = await fetch(DOLLAR_URL, {
            next: { revalidate: 900 },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            throw new Error(`DolarAPI returned ${response.status}`);
        }

        const data = (await response.json()) as DollarApiRate[];
        const requestedRates = [
            { casa: "oficial", label: "Oficial" },
            { casa: "mayorista", label: "Mayorista" },
            { casa: "bolsa", label: "MEP" },
            { casa: "contadoconliqui", label: "CCL" },
            { casa: "blue", label: "Blue" },
            { casa: "cripto", label: "Cripto" },
            { casa: "tarjeta", label: "Tarjeta" },
        ];

        const rates = requestedRates.map(({ casa, label }) => {
            const rate = data.find((candidate) => candidate.casa === casa);

            if (typeof rate?.venta !== "number") {
                throw new Error(`DolarAPI rate not found for ${casa}`);
            }

            return { label, value: rate.venta };
        });
        const updatedAt = data
            .map((rate) => rate.fechaActualizacion)
            .filter((date): date is string => Boolean(date))
            .sort()
            .at(-1) ?? null;

        return { rates, updatedAt, isLive: true };
    } catch {
        return { rates: FALLBACK_DOLLARS, updatedAt: null, isLive: false };
    }
}

export async function getMarketPulseData(): Promise<MarketPulseData> {
    const [weather, grains, dollars] = await Promise.all([
        getWeatherForCoordinates(
            DEFAULT_WEATHER_LOCATION.latitude,
            DEFAULT_WEATHER_LOCATION.longitude,
        ),
        getGrains(),
        getDollars(),
    ]);

    return { weather, grains, dollars };
}
