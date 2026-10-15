import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import {
    fetchMarketRates,
    fetchWeather,
    isWeatherLocation,
    MarketRatesData,
    WeatherData,
    WeatherLocation,
} from "@/lib/field-pulse";
import { WeatherLocationPicker } from "./WeatherLocationPicker";

const LOCATION_STORAGE_KEY = "agroalva:weather-location:v1";
const PRICE_FORMATTER = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
});

function formatPrice(value: number | null) {
    return value === null ? "S/C" : `$ ${PRICE_FORMATTER.format(value)}`;
}

function formatUpdatedAt(value: string | null) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function QuoteRow({ label, value }: { label: string; value: number | null }) {
    return (
        <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>{label}</Text>
            <Text style={styles.quoteValue}>{formatPrice(value)}</Text>
        </View>
    );
}

export function FieldPulse({ variant = "quick-action" }: { variant?: "quick-action" | "details" }) {
    const router = useRouter();
    const isFocused = useIsFocused();
    const { width, fontScale } = useWindowDimensions();
    const hasSelectedLocation = useRef(false);
    const [location, setLocation] = useState<WeatherLocation | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [weatherRefresh, setWeatherRefresh] = useState(0);
    const [rates, setRates] = useState<MarketRatesData | null>(null);
    const [isRatesLoading, setIsRatesLoading] = useState(true);
    const [ratesError, setRatesError] = useState<string | null>(null);
    const [ratesRefresh, setRatesRefresh] = useState(0);

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        let active = true;
        hasSelectedLocation.current = false;

        async function restoreLocation() {
            try {
                const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
                const parsed: unknown = stored ? JSON.parse(stored) : null;

                if (active && !hasSelectedLocation.current && isWeatherLocation(parsed)) {
                    setLocation(parsed);
                }
            } catch {
                // Choosing a location still works if local storage is unavailable.
            }
        }

        void restoreLocation();
        return () => { active = false; };
    }, [isFocused]);

    useEffect(() => {
        if (!isFocused || !location) {
            return;
        }

        const controller = new AbortController();
        setWeather(null);
        setWeatherError(null);
        setIsWeatherLoading(true);

        void fetchWeather(location, controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) {
                    setWeather(result);
                }
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setWeatherError(error instanceof Error ? error.message : "Clima no disponible.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsWeatherLoading(false);
                }
            });

        return () => controller.abort();
    }, [isFocused, location, weatherRefresh]);

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        const controller = new AbortController();
        setRates(null);
        setRatesError(null);
        setIsRatesLoading(true);

        void fetchMarketRates(controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) {
                    setRates(result);
                }
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setRatesError(error instanceof Error ? error.message : "Cotizaciones no disponibles.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsRatesLoading(false);
                }
            });

        return () => controller.abort();
    }, [isFocused, ratesRefresh]);

    function selectLocation(nextLocation: WeatherLocation) {
        hasSelectedLocation.current = true;
        setLocation(nextLocation);
        setPickerVisible(false);
        setWeatherError(null);
        setLocationError(null);
        void AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(nextLocation)).catch(() => {});
    }

    async function handleCurrentLocation() {
        setIsLocating(true);
        setLocationError(null);

        try {
            const permission = await Location.requestForegroundPermissionsAsync();

            if (permission.status !== "granted") {
                setLocationError("Elegí una localidad para ver el clima sin compartir tu ubicación.");
                return;
            }

            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            selectLocation({
                id: "current",
                label: "Mi ubicación",
                latitude: Number(position.coords.latitude.toFixed(3)),
                longitude: Number(position.coords.longitude.toFixed(3)),
            });
        } catch {
            setLocationError("No pudimos acceder a tu ubicación. Podés elegir una localidad.");
        } finally {
            setIsLocating(false);
        }
    }

    const grains = rates?.grains.isLive ? rates.grains.prices : [];
    const dollars = rates?.dollars.isLive ? rates.dollars.rates : [];
    const dollarTime = formatUpdatedAt(rates?.dollars.updatedAt ?? null);

    const stackPreview = width < 320 || fontScale > 1.2;
    const soybean = grains.find((item) => item.label === "Soja");
    const dollar = dollars.find((item) => item.label === "Blue") ?? dollars.find((item) => item.label === "Oficial");

    if (variant === "quick-action") {
        const weatherPreview = weather
            ? `${Math.round(weather.temperature)}° · ${weather.condition}`
            : isWeatherLoading
                ? "Actualizando…"
                : location ? "No disponible" : "Elegí localidad";

        return (
            <Pressable
                onPress={() => router.push("/field-pulse")}
                accessibilityRole="button"
                accessibilityLabel={`Pulso del campo. Clima: ${weatherPreview}. Soja: ${soybean ? formatPrice(soybean.value) : "No disponible"}. Dólar ${dollar?.label ?? ""}: ${dollar ? formatPrice(dollar.value) : "No disponible"}.`}
                accessibilityHint="Abre el clima y todas las cotizaciones"
                style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
            >
                <View style={styles.quickHeader}>
                    <Text style={styles.quickTitle}>Pulso del campo</Text>
                    <View style={styles.quickLink}>
                        <Text style={styles.quickLinkText}>Ver todo</Text>
                        <Ionicons name="chevron-forward" size={16} color="#1B5E20" />
                    </View>
                </View>
                <View style={[styles.previewMetrics, stackPreview && styles.previewMetricsStacked]}>
                    <View style={styles.previewMetric}>
                        <View style={styles.previewLabelRow}>
                            <Ionicons name="partly-sunny-outline" size={16} color="#386948" />
                            <Text style={styles.previewLabel}>Clima</Text>
                        </View>
                        <Text style={styles.previewValue} numberOfLines={1}>{weatherPreview}</Text>
                        <Text style={styles.previewCaption} numberOfLines={1}>{location?.label ?? "Tu zona"}</Text>
                    </View>
                    <View style={styles.previewMetric}>
                        <View style={styles.previewLabelRow}>
                            <Ionicons name="leaf-outline" size={16} color="#386948" />
                            <Text style={styles.previewLabel}>Granos</Text>
                        </View>
                        <Text style={styles.previewValue} numberOfLines={1}>{soybean ? formatPrice(soybean.value) : isRatesLoading ? "Cargando…" : "No disponible"}</Text>
                        <Text style={styles.previewCaption}>Soja · ARS/t</Text>
                    </View>
                    <View style={styles.previewMetric}>
                        <View style={styles.previewLabelRow}>
                            <Ionicons name="cash-outline" size={16} color="#386948" />
                            <Text style={styles.previewLabel}>Dólar</Text>
                        </View>
                        <Text style={styles.previewValue} numberOfLines={1}>{dollar ? formatPrice(dollar.value) : isRatesLoading ? "Cargando…" : "No disponible"}</Text>
                        <Text style={styles.previewCaption}>{dollar?.label ?? "Venta"} · ARS/USD</Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.cards}>
                <View style={styles.weatherCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeading}>
                            <Ionicons name="partly-sunny-outline" size={19} color="#1B5E20" />
                            <Text style={styles.cardTitle}>Clima</Text>
                        </View>
                        <Pressable
                            onPress={() => void handleCurrentLocation()}
                            disabled={isLocating}
                            accessibilityRole="button"
                            accessibilityLabel="Usar mi ubicación para el clima"
                            style={styles.locateButton}
                        >
                            <Ionicons name="locate-outline" size={18} color="#1B5E20" />
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={() => setPickerVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel={location ? `Cambiar localidad: ${location.label}` : "Elegir localidad para el clima"}
                        style={styles.locationButton}
                    >
                        <Ionicons name="location-outline" size={15} color="#386948" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {location?.label ?? "Elegí una localidad"}
                        </Text>
                        <Ionicons name="chevron-down" size={15} color="#386948" />
                    </Pressable>

                    <View style={styles.weatherMain}>
                        <View style={styles.weatherDescription}>
                            <Text style={styles.weatherCondition}>
                                {weather?.condition ?? (isWeatherLoading || isLocating ? "Actualizando…" : location ? "Clima no disponible" : "Elegí una localidad")}
                            </Text>
                            <Text style={styles.weatherRange}>
                                {weather ? `Máx. ${Math.round(weather.maximum)}° · Mín. ${Math.round(weather.minimum)}°` : "Máx. --° · Mín. --°"}
                            </Text>
                        </View>
                        <Text style={styles.temperature}>{weather ? `${Math.round(weather.temperature)}°` : "--°"}</Text>
                    </View>

                    {weather ? (
                        <Text style={styles.weatherDetails}>
                            {`${Math.round(weather.humidity)}% humedad  ·  ${weather.wind}`}
                        </Text>
                    ) : null}
                    {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
                    {weatherError ? <Text style={styles.errorText}>{weatherError}</Text> : null}
                    {location && weatherError && !isWeatherLoading ? (
                        <Pressable onPress={() => setWeatherRefresh((value) => value + 1)} accessibilityRole="button">
                            <Text style={styles.retryText}>Reintentar clima</Text>
                        </Pressable>
                    ) : null}
                </View>

                <View style={styles.ratesCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeading}>
                            <Ionicons name="stats-chart-outline" size={18} color="#1B5E20" />
                            <Text style={styles.cardTitle}>Cotizaciones</Text>
                        </View>
                        {isRatesLoading ? <Text style={styles.loadingText}>Actualizando…</Text> : null}
                    </View>

                    <View style={styles.rateGroup}>
                        <Text style={styles.groupTitle}>Granos</Text>
                        <Text style={styles.groupDetail}>ARS por tonelada · Rosario{rates?.grains.tradingDate ? ` · ${rates.grains.tradingDate}` : ""}</Text>
                        {grains.length > 0 ? grains.map((item) => (
                            <QuoteRow key={item.label} label={item.label} value={item.value} />
                        )) : <Text style={styles.unavailableText}>{isRatesLoading ? "Cargando…" : "No disponible"}</Text>}
                    </View>

                    <View style={styles.rateGroup}>
                        <Text style={styles.groupTitle}>Dólar</Text>
                        <Text style={styles.groupDetail}>Venta · ARS por USD{dollarTime ? ` · ${dollarTime}` : ""}</Text>
                        {dollars.length > 0 ? dollars.map((item) => (
                            <QuoteRow key={item.label} label={item.label} value={item.value} />
                        )) : <Text style={styles.unavailableText}>{isRatesLoading ? "Cargando…" : "No disponible"}</Text>}
                    </View>

                    {ratesError ? <Text style={styles.errorText}>{ratesError}</Text> : null}
                    {!isRatesLoading && (!rates || !rates.grains.isLive || !rates.dollars.isLive) ? (
                        <Pressable onPress={() => setRatesRefresh((value) => value + 1)} accessibilityRole="button">
                            <Text style={styles.retryText}>Reintentar cotizaciones</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
            <Text style={styles.sourceText}>
                {`WeatherAPI.com${weather?.updatedAt ? ` · Actualizado ${weather.updatedAt}` : ""} · Clima orientativo. Para decisiones de seguridad, consultá fuentes oficiales.`}
            </Text>
            <Text style={styles.sourceText}>Fuentes: Cámara Arbitral de Cereales de Rosario · DolarAPI</Text>

            <WeatherLocationPicker
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onSelect={selectLocation}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    section: { gap: 10 },
    quickAction: { backgroundColor: "#EDF3E4", borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: "#D7E2CB" },
    quickActionPressed: { opacity: 0.75 },
    quickHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
    quickTitle: { color: "#1F1A14", fontSize: 15, fontWeight: "800" },
    quickLink: { flexDirection: "row", alignItems: "center", gap: 2 },
    quickLinkText: { color: "#1B5E20", fontSize: 12, fontWeight: "700" },
    previewMetrics: { flexDirection: "row", gap: 12 },
    previewMetricsStacked: { flexDirection: "column" },
    previewMetric: { flex: 1, minWidth: 0, gap: 3 },
    previewLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    previewLabel: { color: "#386948", fontSize: 11, fontWeight: "600" },
    previewValue: { color: "#1C3E26", fontSize: 13, fontWeight: "800" },
    previewCaption: { color: "#586A50", fontSize: 10 },
    cards: { gap: 10 },
    weatherCard: { backgroundColor: "#DFEBCB", borderRadius: 22, padding: 18, gap: 8 },
    ratesCard: { backgroundColor: "#FFFDF8", borderRadius: 22, padding: 18, gap: 12, borderWidth: 1, borderColor: "#E8E0D0" },
    cardHeader: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 },
    cardHeading: { flexDirection: "row", alignItems: "center", gap: 7 },
    cardTitle: { color: "#1F1A14", fontSize: 15, fontWeight: "800" },
    locateButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF99" },
    locationButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", maxWidth: "100%", gap: 5, minHeight: 44 },
    locationText: { color: "#386948", fontSize: 13, fontWeight: "700", flexShrink: 1 },
    weatherMain: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
    weatherDescription: { flex: 1, gap: 3 },
    weatherCondition: { color: "#1C3E26", fontSize: 14, fontWeight: "700" },
    weatherRange: { color: "#386948", fontSize: 12, fontWeight: "600" },
    temperature: { color: "#1C3E26", fontSize: 40, fontWeight: "800" },
    weatherDetails: { color: "#386948", fontSize: 12, fontWeight: "600", borderTopWidth: 1, borderTopColor: "#1B5E2022", paddingTop: 9 },
    rateGroup: { gap: 2 },
    groupTitle: { color: "#1F1A14", fontSize: 14, fontWeight: "800" },
    groupDetail: { color: "#766C60", fontSize: 11, marginBottom: 2 },
    quoteRow: { minHeight: 28, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", columnGap: 6, rowGap: 2 },
    quoteLabel: { color: "#5B5147", fontSize: 14, fontWeight: "600" },
    quoteValue: { color: "#1F1A14", fontSize: 15, fontWeight: "800" },
    unavailableText: { color: "#766C60", fontSize: 13, paddingVertical: 6 },
    loadingText: { color: "#766C60", fontSize: 11 },
    sourceText: { color: "#766C60", fontSize: 10, lineHeight: 14 },
    errorText: { color: "#8A3E2D", fontSize: 12, lineHeight: 17 },
    retryText: { color: "#1B5E20", fontSize: 12, fontWeight: "800", paddingVertical: 12 },
});
