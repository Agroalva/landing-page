import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuthSession } from "@/hooks/use-session";
import {
  DailyStatsChart,
  STATS_COLORS,
  STATS_METRIC_LABELS,
  StatsTiles,
  type StatsMetric,
} from "@/components/ListingStats";

const METRICS: StatsMetric[] = ["views", "contacts", "favorites"];

export default function ProductStatsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.id as Id<"products">;
  const { isAuthenticated, isLoading } = useAuthSession();
  const [metric, setMetric] = useState<StatsMetric>("views");

  const stats = useQuery(
    api.productStats.getProductStats,
    isAuthenticated && productId ? { productId, days: 30 } : "skip"
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/my-posts");
  };

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading || stats === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : stats === null ? (
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={48} color="#BDBDBD" />
          <Text style={styles.emptyText}>
            Solo el autor de la publicación puede ver sus estadísticas.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.push(`/product/${stats.productId}`)}>
            <Text style={styles.productName} numberOfLines={2}>
              {stats.name}
            </Text>
            <Text style={styles.productMeta}>
              Publicado el{" "}
              {new Date(stats.createdAt).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Totales</Text>
          <StatsTiles stats={stats.totals} />

          <Text style={styles.sectionTitle}>Últimos {stats.period.days} días</Text>
          <View style={styles.card}>
            <View style={styles.metricTabs}>
              {METRICS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.metricTab, metric === item && styles.metricTabActive]}
                  onPress={() => setMetric(item)}
                >
                  <Text style={[styles.metricTabText, metric === item && styles.metricTabTextActive]}>
                    {STATS_METRIC_LABELS[item]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.periodTotal}>
              {metric === "contacts"
                ? stats.period.contacts.total
                : stats.period[metric]}{" "}
              <Text style={styles.periodTotalLabel}>
                {STATS_METRIC_LABELS[metric].toLowerCase()} en el período
              </Text>
            </Text>

            <DailyStatsChart daily={stats.daily} metric={metric} />

            {metric === "contacts" && (
              <View style={styles.breakdown}>
                <BreakdownItem color={STATS_COLORS.whatsapp} label="WhatsApp" value={stats.period.contacts.whatsapp} />
                <BreakdownItem color={STATS_COLORS.call} label="Llamadas" value={stats.period.contacts.call} />
                <BreakdownItem color={STATS_COLORS.message} label="Mensajes" value={stats.period.contacts.message} />
              </View>
            )}
          </View>

          <Text style={styles.footnote}>
            Las estadísticas son privadas: solo vos podés verlas. No se cuentan tus propias visitas ni contactos, y los contactos repetidos de una misma persona en poco tiempo se cuentan una sola vez. El detalle diario de visitas y contactos se registra desde la última actualización de Agroalva; los favoritos muestran los que siguen guardados.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BreakdownItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.breakdownItem}>
      <View style={[styles.breakdownDot, { backgroundColor: color }]} />
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#757575",
    textAlign: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  productMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#757575",
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  metricTabs: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  metricTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  metricTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#757575",
  },
  metricTabTextActive: {
    color: "#2E7D32",
  },
  periodTotal: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  periodTotalLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#757575",
  },
  breakdown: {
    marginTop: 16,
    gap: 8,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: "#424242",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  footnote: {
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    color: "#9E9E9E",
  },
});
