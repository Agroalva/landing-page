import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ContactTotals = {
  whatsapp: number;
  call: number;
  message: number;
  total: number;
};

export type ListingStatsSummaryData = {
  views: number;
  favorites: number;
  contacts: ContactTotals;
};

export type DailyStatsPoint = {
  day: string;
  views: number;
  favorites: number;
  whatsapp: number;
  call: number;
  message: number;
};

export type StatsMetric = "views" | "contacts" | "favorites";

export const STATS_METRIC_LABELS: Record<StatsMetric, string> = {
  views: "Visitas",
  contacts: "Contactos",
  favorites: "Favoritos",
};

export const STATS_COLORS = {
  views: "#2E7D32",
  favorites: "#E53935",
  whatsapp: "#25D366",
  call: "#1565C0",
  message: "#F9A825",
};

const formatNumber = (value: number) => value.toLocaleString("es-AR");

const formatDayLabel = (day: string) => {
  const [, month, date] = day.split("-");
  return `${Number(date)}/${Number(month)}`;
};

export const getMetricValue = (point: DailyStatsPoint, metric: StatsMetric) => {
  if (metric === "contacts") {
    return point.whatsapp + point.call + point.message;
  }
  return point[metric];
};

type StatItemProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  value: number;
  label: string;
};

function StatItem({ icon, color, value, label }: StatItemProps) {
  return (
    <View style={styles.statItem} accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.statValue}>{formatNumber(value)}</Text>
    </View>
  );
}

type ListingStatsSummaryProps = {
  stats?: ListingStatsSummaryData;
  onPressDetails?: () => void;
};

/** Compact private stats row shown to the author under each listing. */
export function ListingStatsSummary({ stats, onPressDetails }: ListingStatsSummaryProps) {
  return (
    <View style={styles.summaryContainer}>
      {stats ? (
        <View style={styles.summaryRow}>
          <StatItem icon="eye-outline" color={STATS_COLORS.views} value={stats.views} label="Visitas" />
          <StatItem icon="heart-outline" color={STATS_COLORS.favorites} value={stats.favorites} label="Favoritos" />
          <StatItem icon="logo-whatsapp" color={STATS_COLORS.whatsapp} value={stats.contacts.whatsapp} label="WhatsApp" />
          <StatItem icon="call-outline" color={STATS_COLORS.call} value={stats.contacts.call} label="Llamadas" />
          <StatItem icon="chatbubble-outline" color={STATS_COLORS.message} value={stats.contacts.message} label="Mensajes" />
        </View>
      ) : (
        <Text style={styles.summaryLoading}>Cargando estadísticas…</Text>
      )}
      {onPressDetails && (
        <TouchableOpacity style={styles.detailsButton} onPress={onPressDetails} hitSlop={8}>
          <Ionicons name="stats-chart-outline" size={14} color="#2E7D32" />
          <Text style={styles.detailsButtonText}>Ver estadísticas</Text>
          <Ionicons name="chevron-forward" size={14} color="#2E7D32" />
        </TouchableOpacity>
      )}
    </View>
  );
}

type StatsTilesProps = {
  stats: ListingStatsSummaryData;
};

/** Larger tiles: visitas, favoritos y contactos por canal. */
export function StatsTiles({ stats }: StatsTilesProps) {
  const tiles = [
    { key: "views", label: "Visitas", value: stats.views, icon: "eye-outline", color: STATS_COLORS.views },
    { key: "favorites", label: "Favoritos", value: stats.favorites, icon: "heart-outline", color: STATS_COLORS.favorites },
    { key: "whatsapp", label: "WhatsApp", value: stats.contacts.whatsapp, icon: "logo-whatsapp", color: STATS_COLORS.whatsapp },
    { key: "call", label: "Llamadas", value: stats.contacts.call, icon: "call-outline", color: STATS_COLORS.call },
    { key: "message", label: "Mensajes", value: stats.contacts.message, icon: "chatbubble-outline", color: STATS_COLORS.message },
  ] as const;

  return (
    <View style={styles.tilesGrid}>
      {tiles.map((tile) => (
        <View key={tile.key} style={styles.tile}>
          <View style={styles.tileHeader}>
            <Ionicons name={tile.icon} size={16} color={tile.color} />
            <Text style={styles.tileLabel}>{tile.label}</Text>
          </View>
          <Text style={styles.tileValue}>{formatNumber(tile.value)}</Text>
        </View>
      ))}
    </View>
  );
}

type DailyStatsChartProps = {
  daily: DailyStatsPoint[];
  metric: StatsMetric;
};

const CHART_HEIGHT = 140;

/** Minimal bar chart (no extra dependencies) for the last N days. */
export function DailyStatsChart({ daily, metric }: DailyStatsChartProps) {
  const values = useMemo(() => daily.map((point) => getMetricValue(point, metric)), [daily, metric]);
  const max = Math.max(...values, 0);
  const color = metric === "contacts" ? STATS_COLORS.whatsapp : STATS_COLORS[metric];
  const middleIndex = Math.floor(daily.length / 2);

  return (
    <View>
      <View style={styles.chartArea}>
        <Text style={styles.chartMax}>{formatNumber(max)}</Text>
        <View style={styles.barsRow}>
          {values.map((value, index) => {
            const height = max > 0 ? Math.max((value / max) * CHART_HEIGHT, value > 0 ? 3 : 1) : 1;
            return (
              <View key={daily[index].day} style={styles.barSlot}>
                <View
                  style={[
                    styles.bar,
                    { height, backgroundColor: value > 0 ? color : "#E0E0E0" },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>
      {daily.length > 0 && (
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>{formatDayLabel(daily[0].day)}</Text>
          <Text style={styles.axisLabel}>{formatDayLabel(daily[middleIndex].day)}</Text>
          <Text style={styles.axisLabel}>Hoy</Text>
        </View>
      )}
      {max === 0 && (
        <Text style={styles.chartEmpty}>Sin actividad en este período</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLoading: {
    fontSize: 13,
    color: "#9E9E9E",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
  },
  tilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tile: {
    flexGrow: 1,
    flexBasis: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tileLabel: {
    fontSize: 12,
    color: "#757575",
  },
  tileValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  chartArea: {
    position: "relative",
    paddingTop: 16,
  },
  chartMax: {
    position: "absolute",
    top: 0,
    left: 0,
    fontSize: 11,
    color: "#9E9E9E",
  },
  barsRow: {
    height: CHART_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  barSlot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  axisRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisLabel: {
    fontSize: 11,
    color: "#9E9E9E",
  },
  chartEmpty: {
    marginTop: 8,
    fontSize: 13,
    color: "#9E9E9E",
    textAlign: "center",
  },
});
