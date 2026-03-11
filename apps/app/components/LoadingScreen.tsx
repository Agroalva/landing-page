import { View, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Text } from "react-native";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#2E7D32" style={styles.spinner} />
      <Text style={styles.text}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 8,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
});
