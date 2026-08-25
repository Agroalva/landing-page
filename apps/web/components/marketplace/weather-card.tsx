"use client";

import { useEffect, useRef, useState } from "react";
import {
    CloudSun,
    Droplets,
    LoaderCircle,
    LocateFixed,
    MapPin,
    Wind,
} from "lucide-react";
import type { MarketPulseData } from "@/lib/market-data";
import {
    WeatherLocationPicker,
    type WeatherLocation,
} from "@/components/marketplace/weather-location-picker";

type Weather = MarketPulseData["weather"];

const STORAGE_KEY = "agroalva:weather-location:v2";
let automaticLocationPromise: Promise<GeolocationPosition> | null = null;

function roundCoordinate(value: number) {
    return Number(value.toFixed(3));
}

function locationFromPosition(position: GeolocationPosition): WeatherLocation {
    return {
        id: "current",
        label: "Mi ubicación",
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
    };
}

function getAutomaticLocation() {
    if (!automaticLocationPromise) {
        automaticLocationPromise = new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                maximumAge: 600000,
                timeout: 8000,
            });
        });
    }

    return automaticLocationPromise;
}

function getCurrentLocation() {
    return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            maximumAge: 60000,
            timeout: 8000,
        });
    });
}

function readStoredLocation(): WeatherLocation | null {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<WeatherLocation> | null;

        if (
            value &&
            typeof value.id === "string" &&
            typeof value.label === "string" &&
            typeof value.latitude === "number" &&
            typeof value.longitude === "number"
        ) {
            return value as WeatherLocation;
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }

    return null;
}

function storeLocation(location: WeatherLocation) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } catch {
        // Weather still works when storage is unavailable or full.
    }
}

async function fetchWeather(location: WeatherLocation, signal?: AbortSignal) {
    const searchParams = new URLSearchParams({
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
    });
    const response = await fetch(`/api/weather?${searchParams}`, { signal });

    if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No pudimos consultar el clima en este momento.");
    }

    return response.json() as Promise<Weather>;
}

function hasCompleteWeather(weather: Weather | null): weather is Weather & {
    temperature: number;
    condition: string;
    maximum: number;
    minimum: number;
    humidity: number;
    wind: string;
} {
    return Boolean(
        weather?.isLive &&
        weather.temperature !== null &&
        weather.condition !== null &&
        weather.maximum !== null &&
        weather.minimum !== null &&
        weather.humidity !== null &&
        weather.wind !== null,
    );
}

export function WeatherCard({ initialWeather }: { initialWeather: Weather }) {
    const [weather, setWeather] = useState<Weather | null>(initialWeather.isLive ? initialWeather : null);
    const [location, setLocation] = useState<WeatherLocation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const hasUserInteracted = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;

        async function loadInitialLocation() {
            const storedLocation = readStoredLocation();

            if (storedLocation) {
                setIsLoading(true);
                setLocation(storedLocation);

                try {
                    const nextWeather = await fetchWeather(storedLocation, controller.signal);

                    if (isActive && !hasUserInteracted.current) {
                        setLocation(storedLocation);
                        setWeather(nextWeather);
                    }
                } catch (error) {
                    if (isActive && !controller.signal.aborted) {
                        setWeather(null);
                        setMessage(error instanceof Error ? error.message : "No pudimos actualizar esta ubicación.");
                    }
                } finally {
                    if (isActive) {
                        setIsLoading(false);
                    }
                }

                return;
            }

            if (!navigator.geolocation) {
                setMessage("Elegí una ubicación para ver el clima local.");
                return;
            }

            setIsLoading(true);

            try {
                const position = await getAutomaticLocation();
                const currentLocation = locationFromPosition(position);
                setLocation(currentLocation);
                const nextWeather = await fetchWeather(currentLocation, controller.signal);

                if (isActive && !hasUserInteracted.current) {
                    setLocation(currentLocation);
                    setWeather(nextWeather);
                    storeLocation(currentLocation);
                }
            } catch (error) {
                if (isActive && !controller.signal.aborted) {
                    setWeather(null);
                    setMessage(
                        error instanceof Error && error.message.startsWith("El servicio")
                            ? error.message
                            : "Elegí una ubicación para ver el clima local.",
                    );
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void loadInitialLocation();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, []);

    async function selectLocation(nextLocation: WeatherLocation) {
        hasUserInteracted.current = true;
        setIsLoading(true);
        setMessage(null);
        setLocation(nextLocation);
        setWeather(null);
        storeLocation(nextLocation);

        try {
            const nextWeather = await fetchWeather(nextLocation);
            setWeather(nextWeather);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "No pudimos actualizar esta ubicación.");
        } finally {
            setIsLoading(false);
        }
    }

    async function useCurrentLocation() {
        hasUserInteracted.current = true;
        setMessage(null);

        if (!navigator.geolocation) {
            setMessage("Tu navegador no permite acceder a la ubicación.");
            return;
        }

        setIsLoading(true);

        try {
            const position = await getCurrentLocation();
            const currentLocation = locationFromPosition(position);
            setLocation(currentLocation);
            setWeather(null);
            storeLocation(currentLocation);
            const nextWeather = await fetchWeather(currentLocation);
            setWeather(nextWeather);
        } catch (error) {
            setMessage(
                error instanceof Error && error.message.startsWith("El servicio")
                    ? error.message
                    : "No pudimos acceder a tu ubicación. Podés elegir una de la lista.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    const liveWeather = location && hasCompleteWeather(weather) ? weather : null;

    return (
        <section className="rounded-[1.4rem] bg-[#dcebb6] p-4" aria-labelledby="weather-title" aria-live="polite">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-emerald-950">
                        <CloudSun className="size-5 shrink-0" />
                        <h3 id="weather-title" className="text-sm font-black">Clima</h3>
                    </div>
                    <div className="mt-2 flex max-w-64 items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-emerald-950/65" />
                        <WeatherLocationPicker
                            value={location}
                            disabled={isLoading}
                            onSelect={(nextLocation) => void selectLocation(nextLocation)}
                        />
                        <button
                            type="button"
                            onClick={() => void useCurrentLocation()}
                            disabled={isLoading}
                            aria-label="Usar mi ubicación actual"
                            title="Usar mi ubicación actual"
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-950/10 bg-white/45 text-emerald-950 transition hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-65"
                        >
                            {isLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : <LocateFixed className="size-3.5" />}
                        </button>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-emerald-950/75">
                        {liveWeather ? liveWeather.condition : isLoading ? "Actualizando…" : "Clima no disponible"}
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-4xl font-black tracking-[-0.06em] text-emerald-950">
                        {liveWeather ? `${Math.round(liveWeather.temperature)}°` : "--°"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-emerald-950/65">
                        {liveWeather
                            ? `Máx. ${Math.round(liveWeather.maximum)}° · Mín. ${Math.round(liveWeather.minimum)}°`
                            : "Máx. --° · Mín. --°"}
                    </p>
                </div>
            </div>
            <div className="mt-4 flex gap-5 border-t border-emerald-950/10 pt-3 text-xs font-bold text-emerald-950/65">
                <span className="flex items-center gap-1.5">
                    <Droplets className="size-3.5" /> {liveWeather ? `${Math.round(liveWeather.humidity)}% humedad` : "--% humedad"}
                </span>
                <span className="flex items-center gap-1.5">
                    <Wind className="size-3.5" /> {liveWeather ? liveWeather.wind : "-- km/h"}
                </span>
            </div>
            {message ? <p className="mt-2 text-[0.65rem] font-semibold text-emerald-950/60">{message}</p> : null}
            <p className="mt-2 text-[0.6rem] leading-4 text-emerald-950/50">
                El clima es orientativo y puede no ser preciso para tu ubicación u horario. Para decisiones de seguridad, consultá fuentes oficiales.
            </p>
        </section>
    );
}
