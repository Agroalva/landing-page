import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();
const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1";
const GEOREF_LOCALITIES_URL = "https://apis.datos.gob.ar/georef/api/localidades";

type WeatherApiResponse = {
    current?: {
        last_updated?: string;
        temp_c?: number;
        condition?: { text?: string };
        humidity?: number;
        wind_kph?: number;
        wind_dir?: string;
    };
    forecast?: {
        forecastday?: Array<{
            day?: {
                maxtemp_c?: number;
                mintemp_c?: number;
            };
        }>;
    };
};

type GeoRefLocality = {
    id?: string;
    nombre?: string;
    centroide?: { lat?: number; lon?: number };
    departamento?: { nombre?: string };
    provincia?: { nombre?: string };
};

type GeoRefLocalitiesResponse = {
    cantidad?: number;
    inicio?: number;
    localidades?: GeoRefLocality[];
    total?: number;
};

authComponent.registerRoutes(http, createAuth);

http.route({
    path: "/public/weather",
    method: "GET",
    handler: httpAction(async (_ctx, request) => {
        const { searchParams } = new URL(request.url);
        const latitude = Number(searchParams.get("latitude"));
        const longitude = Number(searchParams.get("longitude"));

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return Response.json(
                { error: "Las coordenadas no son válidas." },
                { status: 400 },
            );
        }

        const apiKey = process.env.WEATHERAPI_API_KEY?.trim();

        if (!apiKey) {
            return Response.json(
                { error: "El servicio de clima todavía no está configurado." },
                { status: 503 },
            );
        }

        try {
            const weatherParams = new URLSearchParams({
                key: apiKey,
                q: `${latitude.toFixed(3)},${longitude.toFixed(3)}`,
                days: "1",
                aqi: "no",
                alerts: "no",
                lang: "es",
            });
            const response = await fetch(`${WEATHER_API_BASE_URL}/forecast.json?${weatherParams}`);

            if (!response.ok) {
                throw new Error(`WeatherAPI returned ${response.status}`);
            }

            const data = (await response.json()) as WeatherApiResponse;
            const current = data.current;
            const maximum = data.forecast?.forecastday?.[0]?.day?.maxtemp_c;
            const minimum = data.forecast?.forecastday?.[0]?.day?.mintemp_c;

            if (
                !current ||
                typeof current.temp_c !== "number" ||
                typeof current.condition?.text !== "string" ||
                typeof current.humidity !== "number" ||
                typeof current.wind_kph !== "number" ||
                typeof current.wind_dir !== "string" ||
                typeof maximum !== "number" ||
                typeof minimum !== "number"
            ) {
                throw new Error("WeatherAPI response is incomplete");
            }

            return Response.json(
                {
                    temperature: current.temp_c,
                    condition: current.condition.text,
                    maximum,
                    minimum,
                    humidity: current.humidity,
                    wind: `${current.wind_dir} ${Math.round(current.wind_kph)} km/h`,
                    updatedAt: current.last_updated ?? null,
                    isLive: true,
                },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
                        "Content-Type": "application/json",
                    },
                },
            );
        } catch {
            return Response.json(
                { error: "No pudimos consultar el clima en este momento." },
                { status: 502 },
            );
        }
    }),
});

http.route({
    path: "/public/weather-locations",
    method: "GET",
    handler: httpAction(async (_ctx, request) => {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim() ?? "";
        const page = Number(searchParams.get("page") ?? "1");
        const pageSize = Number(searchParams.get("pageSize") ?? "5");

        if (query.length === 1 || query.length > 80) {
            return Response.json(
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
            return Response.json(
                { error: "La paginación no es válida." },
                { status: 400 },
            );
        }

        try {
            const start = (page - 1) * pageSize;
            const geoRefParams = new URLSearchParams({
                inicio: start.toString(),
                max: pageSize.toString(),
                orden: "nombre",
            });

            if (query) {
                geoRefParams.set("nombre", query);
            }

            const response = await fetch(`${GEOREF_LOCALITIES_URL}?${geoRefParams}`);

            if (!response.ok) {
                throw new Error(`GeoRef returned ${response.status}`);
            }

            const data = (await response.json()) as GeoRefLocalitiesResponse;
            const total = typeof data.total === "number" ? data.total : 0;
            const locations = (data.localidades ?? [])
                .filter((candidate) =>
                    typeof candidate.id === "string" &&
                    typeof candidate.nombre === "string" &&
                    typeof candidate.centroide?.lat === "number" &&
                    typeof candidate.centroide.lon === "number" &&
                    typeof candidate.provincia?.nombre === "string",
                )
                .map((candidate) => {
                    const department = candidate.departamento?.nombre?.trim();
                    const province = candidate.provincia?.nombre?.trim();
                    const territory = department && department !== candidate.nombre
                        ? `${department}, ${province}`
                        : province;

                    return {
                        id: `georef:${candidate.id}`,
                        label: `${candidate.nombre} · ${territory}`,
                        latitude: candidate.centroide?.lat as number,
                        longitude: candidate.centroide?.lon as number,
                    };
                });

            return Response.json(
                {
                    items: locations,
                    page,
                    pageSize,
                    total,
                    hasNextPage: start + locations.length < total,
                },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                        "Content-Type": "application/json",
                    },
                },
            );
        } catch {
            return Response.json(
                { error: "No pudimos consultar las localidades en este momento." },
                { status: 502 },
            );
        }
    }),
});

http.route({
    path: "/public/product-share",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("id")?.trim();

        if (!productId) {
            return Response.json(
                { error: "Missing product id" },
                { status: 400 },
            );
        }

        try {
            const product = await ctx.runQuery(api.products.getShareById, {
                productId: productId as Id<"products">,
            });

            if (!product) {
                return Response.json(
                    { error: "Product not found" },
                    { status: 404 },
                );
            }

            return Response.json(product, {
                status: 200,
                headers: {
                    "Cache-Control": "public, max-age=60",
                    "Content-Type": "application/json",
                },
            });
        } catch {
            return Response.json(
                { error: "Invalid product id" },
                { status: 400 },
            );
        }
    }),
});

http.route({
    path: "/public/marketplace-product",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("id")?.trim();

        if (!productId) {
            return Response.json({ error: "Missing product id" }, { status: 400 });
        }

        try {
            const product = await ctx.runQuery(api.marketplace.getProduct, {
                productId: productId as Id<"products">,
            });
            if (!product) {
                return Response.json({ error: "Product not found" }, { status: 404 });
            }
            return Response.json(product, {
                status: 200,
                headers: {
                    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
                    "Content-Type": "application/json",
                },
            });
        } catch {
            return Response.json({ error: "Invalid product id" }, { status: 400 });
        }
    }),
});

http.route({
    path: "/public/storage-image",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const { searchParams } = new URL(request.url);
        const storageId = searchParams.get("storageId")?.trim();

        console.log("[storage-image] request", {
            url: request.url,
            storageId: storageId ?? null,
        });

        if (!storageId) {
            console.warn("[storage-image] missing storage id");
            return Response.json(
                { error: "Missing storage id" },
                { status: 400 },
            );
        }

        try {
            const blob = await ctx.storage.get(storageId as Id<"_storage">);

            if (!blob) {
                console.warn("[storage-image] image not found", { storageId });
                return Response.json(
                    { error: "Image not found" },
                    { status: 404 },
                );
            }

            console.log("[storage-image] serving blob", {
                storageId,
                contentType: blob.type || "application/octet-stream",
                size: blob.size,
            });

            return new Response(blob, {
                status: 200,
                headers: {
                    "Cache-Control": "public, max-age=3600",
                    "Content-Type": blob.type || "application/octet-stream",
                },
            });
        } catch {
            console.error("[storage-image] invalid storage id", { storageId });
            return Response.json(
                { error: "Invalid storage id" },
                { status: 400 },
            );
        }
    }),
});

export default http;
