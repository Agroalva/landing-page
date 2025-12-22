import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Redirect, type Href } from "expo-router";
import { useAuthSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { ActivityIndicator } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthSession();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [password, setPassword] = React.useState("");

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleSignOut = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await authClient.signOut();
              // La navegación se gestionará automáticamente por el estado de autenticación
            } catch (error) {
              Alert.alert("Error", "No se pudo cerrar sesión");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      
      // Use Better Auth's deleteUser method
      // This will automatically call the beforeDelete callback to clean up Convex data
      const result = await authClient.deleteUser({
        password: password || undefined, // If user has password auth, use it
      });

      if (result.error) {
        Alert.alert(
          "Error",
          result.error.message || "No se pudo eliminar la cuenta. Verifica tu contraseña."
        );
        return;
      }

      // Account deleted successfully, Better Auth will handle sign out
      // Don't manually navigate - let auth state changes handle navigation automatically
      Alert.alert(
        "Cuenta eliminada",
        "Tu cuenta ha sido eliminada permanentemente.",
        [
          {
            text: "OK",
            // Navigation will be handled automatically by auth state change
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "No se pudo eliminar la cuenta. Intenta cerrar sesión e iniciar sesión nuevamente antes de eliminar."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setPassword("");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/edit-profile")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Editar perfil</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Email</Text>
            </View>
            <Text style={styles.menuValue}>{user?.email || "No disponible"}</Text>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Notificaciones push</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/terms-and-conditions" as Href)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Términos y Condiciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#2E7D32" />
              <Text style={styles.menuText}>Versión</Text>
            </View>
            <Text style={styles.menuValue}>1.0.0</Text>
          </View>
        </View>

        {/* Delete Account Section */}
        <View style={styles.section}>
          {showDeleteConfirm && (
            <View style={styles.deleteBanner}>
              <View style={styles.deleteBannerHeader}>
                <Ionicons name="warning-outline" size={22} color="#F44336" />
                <Text style={styles.deleteBannerTitle}>Eliminar cuenta</Text>
              </View>
              <Text style={styles.deleteBannerDescription}>
                Esta acción es permanente. Se eliminarán tu perfil, publicaciones, favoritos y datos asociados.
              </Text>
              
              {/* Password input for authentication */}
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>
                  Ingresa tu contraseña para confirmar (opcional si iniciaste sesión recientemente):
                </Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Contraseña"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!isDeleting}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.deleteBannerActions}>
                <TouchableOpacity
                  style={styles.deleteCancelButton}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setPassword("");
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteConfirmButton}
                  onPress={handleConfirmDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteConfirmText}>Eliminar definitivamente</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="trash-outline" size={22} color="#F44336" />
              <Text style={styles.deleteAccountText}>Eliminar cuenta</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color="#F44336" />
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#757575",
    marginBottom: 8,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#212121",
  },
  menuValue: {
    fontSize: 14,
    color: "#757575",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F44336",
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteAccountText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F44336",
  },
  deleteBanner: {
    backgroundColor: "#FFEBEE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  deleteBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  deleteBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#C62828",
  },
  deleteBannerDescription: {
    fontSize: 14,
    color: "#B71C1C",
    marginBottom: 12,
  },
  deleteBannerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  deleteCancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BDBDBD",
  },
  deleteCancelText: {
    fontSize: 14,
    color: "#424242",
    fontWeight: "500",
  },
  deleteConfirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F44336",
  },
  deleteConfirmText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  passwordContainer: {
    marginBottom: 12,
  },
  passwordLabel: {
    fontSize: 13,
    color: "#B71C1C",
    marginBottom: 8,
    fontWeight: "500",
  },
  passwordInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#212121",
  },
});

