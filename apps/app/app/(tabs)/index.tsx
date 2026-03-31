import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthSession } from "@/hooks/use-session";
import { buildPublicStorageImageUrl } from "@/utils/public-url";
import { useEffect, useMemo, useState } from "react";

type TopLevelIntent = "products" | "services";

type DiscoveryCardDefinition = {
  id: TopLevelIntent;
  title: string;
  subtitle: React.ReactNode;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  surface: string;
};

const DISCOVERY_CARDS: DiscoveryCardDefinition[] = [
  {
    id: "products",
    title: "Productos",
    subtitle: (
      <span>
        <strong>Compra y venta</strong> de maquinaria, vehículos, repuestos y
        más.
      </span>
    ),
    caption: "Explorar artículos disponibles",
    icon: "cube-outline",
    accent: "#1B5E20",
    surface: "#E8F5E9",
  },
  {
    id: "services",
    title: "Servicios",
    subtitle: "Contrata maquinaria, personal, transporte y campo.",
    caption: "Buscar prestadores activos",
    icon: "construct-outline",
    accent: "#0D47A1",
    surface: "#E3F2FD",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthSession();
  const { width } = useWindowDimensions();
  const bannerWidth = Math.max(width - 40, 1);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const unreadNotificationCount = useQuery(
    api.notifications.getUnreadCount,
    isAuthenticated ? {} : "skip",
  );
  const homeBanners = useQuery(api.banners.listActive);
  const visibleBanners = useMemo(() => homeBanners ?? [], [homeBanners]);

  useEffect(() => {
    if (visibleBanners.length === 0) {
      setActiveBannerIndex(0);
      return;
    }

    setActiveBannerIndex((currentIndex) =>
      Math.min(currentIndex, visibleBanners.length - 1),
    );
  }, [visibleBanners.length]);

  const navigateToBrowse = (topLevel: TopLevelIntent) => {
    router.push({
      pathname: "/(tabs)/search",
      params: { topLevel },
    });
  };

  const openBannerUrl = async (targetUrl?: string) => {
    if (!targetUrl) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (!canOpen) {
        return;
      }

      await Linking.openURL(targetUrl);
    } catch (error) {
      console.warn("Failed to open banner URL:", error);
    }
  };

  const handleBannerScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!bannerWidth) {
      return;
    }

    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / bannerWidth,
    );
    setActiveBannerIndex(nextIndex);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <ExpoImage
            source={require("../../assets/images/android-icon-monochrome.png")}
            style={styles.headerLogo}
            contentFit="contain"
            tintColor="#1B5E20"
          />
          {/*<Text style={styles.logo}>Agroalva</Text>*/}
        </View>
        {isAuthenticated ? (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="#1B5E20" />
            {unreadNotificationCount !== undefined &&
              unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </Text>
                </View>
              )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push("/(auth)/sign-in")}
          >
            <Text style={styles.signInText}>Iniciar sesión</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {visibleBanners.length > 0 ? (
          <View style={styles.bannerSection}>
            <View style={styles.bannerHeader}>
              <Text style={styles.bannerEyebrow}>Destacados</Text>
              <Text style={styles.bannerCounter}>
                {activeBannerIndex + 1}/{visibleBanners.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={bannerWidth}
              snapToAlignment="start"
              onMomentumScrollEnd={handleBannerScrollEnd}
              contentContainerStyle={styles.bannerTrack}
            >
              {visibleBanners.map((banner: (typeof visibleBanners)[number]) => (
                <TouchableOpacity
                  key={banner._id}
                  style={[styles.bannerCard, { width: bannerWidth }]}
                  onPress={() => openBannerUrl(banner.targetUrl)}
                  activeOpacity={banner.targetUrl ? 0.9 : 1}
                  disabled={!banner.targetUrl}
                >
                  <View style={styles.bannerFrame}>
                    <View style={styles.bannerImageWrap}>
                      <BannerImage
                        imageUrl={buildPublicStorageImageUrl(
                          banner.imageStorageId,
                        )}
                      />
                      {banner.targetUrl ? (
                        <View style={styles.bannerCtaWrap}>
                          <Text style={styles.bannerCtaText}>Abrir enlace</Text>
                          <Ionicons
                            name="open-outline"
                            size={14}
                            color="#FFFFFF"
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.bannerDots}>
              {visibleBanners.map(
                (banner: (typeof visibleBanners)[number], index: number) => (
                  <View
                    key={banner._id}
                    style={[
                      styles.bannerDot,
                      index === activeBannerIndex && styles.bannerDotActive,
                    ]}
                  />
                ),
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Explora por tipo</Text>
            <Text style={styles.sectionSubtitle}>
              Productos físicos o servicios, con filtros en el siguiente paso.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.searchShortcut}
            onPress={() => router.push("/(tabs)/search")}
            activeOpacity={0.85}
          >
            <Ionicons name="search" size={18} color="#1B5E20" />
            <Text style={styles.searchShortcutText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {DISCOVERY_CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.discoveryCard, { backgroundColor: card.surface }]}
            onPress={() => navigateToBrowse(card.id)}
            activeOpacity={0.88}
          >
            <ExpoImage
              source={require("../../assets/images/android-icon-monochrome.png")}
              style={[styles.discoveryOrb]}
              contentFit="contain"
              tintColor={card.accent}
            />
            <View style={styles.discoveryContent}>
              <View style={styles.discoveryIconRow}>
                <View
                  style={[
                    styles.discoveryIconWrap,
                    { backgroundColor: card.accent },
                  ]}
                >
                  <Ionicons name={card.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.discoveryCaption, { color: card.accent }]}>
                  {card.caption}
                </Text>
              </View>
              <Text style={styles.discoveryTitle}>{card.title}</Text>
              <Text style={styles.discoverySubtitle}>{card.subtitle}</Text>
            </View>
            <View
              style={[styles.discoveryArrowWrap, { borderColor: card.accent }]}
            >
              <Ionicons name="arrow-forward" size={20} color={card.accent} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push(isAuthenticated ? "/create-post" : "/(auth)/sign-in")
        }
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function BannerImage({ imageUrl }: { imageUrl: string }) {
  return (
    <ExpoImage
      source={imageUrl}
      style={styles.bannerImage}
      contentFit="contain"
      cachePolicy="none"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F1EA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFDF8",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D0",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogo: {
    width: 64,
    height: 64,
  },
  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1B5E20",
    letterSpacing: 0.2,
  },
  notificationButton: {
    padding: 4,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#C62828",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFDF8",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1B5E20",
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 18,
  },
  searchShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF7EF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D7E8D8",
  },
  searchShortcutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B5E20",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F1A14",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6A5F50",
  },
  discoveryCard: {
    borderRadius: 28,
    padding: 20,
    minHeight: 154,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 20, 0.08)",
  },
  discoveryOrb: {
    position: "absolute",
    width: 160,
    height: 160,
    top: -54,
    right: -28,
    opacity: 0.14,
  },
  discoveryContent: {
    flex: 1,
    gap: 10,
    justifyContent: "space-between",
  },
  discoveryIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  discoveryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  discoveryCaption: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  discoveryTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F1A14",
  },
  discoverySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4D4336",
    maxWidth: "84%",
  },
  discoveryArrowWrap: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  bannerSection: {
    gap: 8,
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: "#1B5E20",
  },
  bannerCounter: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6A5F50",
  },
  bannerTrack: {
    gap: 0,
  },
  bannerCard: {
    paddingRight: 0,
  },
  bannerFrame: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 20, 0.08)",
    backgroundColor: "#DCE6D3",
  },
  bannerImageWrap: {
    aspectRatio: 16 / 4,
    justifyContent: "flex-end",
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "#EEF2EA",
    position: "relative",
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  bannerCtaWrap: {
    position: "absolute",
    left: 14,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(8, 24, 16, 0.72)",
  },
  bannerCtaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(27, 94, 32, 0.18)",
  },
  bannerDotActive: {
    width: 22,
    backgroundColor: "#1B5E20",
  },
  promoCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#1F3A2C",
    gap: 10,
  },
  promoEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#A8D5A2",
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  promoBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#D9E8DA",
  },
  promoCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  promoCtaText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 26,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
});
