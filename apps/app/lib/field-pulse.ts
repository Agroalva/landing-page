import { getPublicWebBaseUrl } from "@/utils/public-url";

export type WeatherLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type WeatherData = {
  temperature: number;
  condition: string;
  maximum: number;
  minimum: number;
  humidity: number;
  wind: string;
  updatedAt: string | null;
  isLive: true;
};

export type MarketRatesData = {
  grains: {
    prices: Array<{ label: string; value: number | null }>;
    tradingDate: string | null;
    isLive: boolean;
  };
  dollars: {
    rates: Array<{ label: string; value: number }>;
    updatedAt: string | null;
    isLive: boolean;
  };
};

function getConvexSiteUrl() {
  const siteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL?.trim();

  if (!siteUrl) {
    throw new Error("El servicio de clima no está configurado.");
  }

  return siteUrl.replace(/\/+$/, "");
}

async function readJson(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && typeof data.error === "string"
        ? data.error
        : "No pudimos actualizar los datos.",
    );
  }

  return data;
}

async function requestJson(url: string, signal: AbortSignal | undefined, networkError: string) {
  try {
    const response = await fetch(url, { signal });
    return await readJson(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(networkError);
    }

    throw error;
  }
}

export function isWeatherLocation(value: unknown): value is WeatherLocation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const location = value as Partial<WeatherLocation>;
  return (
    typeof location.id === "string" &&
    typeof location.label === "string" &&
    typeof location.latitude === "number" &&
    Number.isFinite(location.latitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    typeof location.longitude === "number" &&
    Number.isFinite(location.longitude) &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

export async function fetchWeather(location: WeatherLocation, signal?: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(3),
    longitude: location.longitude.toFixed(3),
  });
  const data = await requestJson(
    `${getConvexSiteUrl()}/public/weather?${params}`,
    signal,
    "No pudimos conectar con el servicio de clima.",
  );

  if (
    !data ||
    data.isLive !== true ||
    typeof data.temperature !== "number" ||
    typeof data.condition !== "string" ||
    typeof data.maximum !== "number" ||
    typeof data.minimum !== "number" ||
    typeof data.humidity !== "number" ||
    typeof data.wind !== "string"
  ) {
    throw new Error("No pudimos consultar el clima en este momento.");
  }

  return data as WeatherData;
}

export async function searchWeatherLocations(query: string, signal?: AbortSignal): Promise<WeatherLocation[]> {
  const params = new URLSearchParams({ q: query, page: "1", pageSize: "10" });
  const data = await requestJson(
    `${getConvexSiteUrl()}/public/weather-locations?${params}`,
    signal,
    "No pudimos conectar con la búsqueda de localidades.",
  );

  if (!data || !Array.isArray(data.items)) {
    throw new Error("No pudimos buscar localidades.");
  }

  return data.items.filter(isWeatherLocation);
}

export async function fetchMarketRates(signal?: AbortSignal): Promise<MarketRatesData> {
  const data = await requestJson(
    `${getPublicWebBaseUrl()}/api/market-rates`,
    signal,
    "No pudimos conectar con las cotizaciones.",
  );

  if (
    !data ||
    !data.grains ||
    !data.dollars ||
    typeof data.grains.isLive !== "boolean" ||
    typeof data.dollars.isLive !== "boolean" ||
    !Array.isArray(data.grains.prices) ||
    !Array.isArray(data.dollars.rates)
  ) {
    throw new Error("No pudimos consultar las cotizaciones.");
  }

  return data as MarketRatesData;
}
