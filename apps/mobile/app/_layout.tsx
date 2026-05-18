import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import * as SystemUI from "expo-system-ui";
import { useAuthStore } from "@/lib/stores/authStore";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

SystemUI.setBackgroundColorAsync(colors.cream).catch(() => {});

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const initLang = useI18n((s) => s.initLang);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initAuth();
    initLang();
  }, [initAuth, initLang]);

  useEffect(() => {
    if (!initialized) return;

    const inAuthScreen = segments[0] === "auth";

    if (!user && !inAuthScreen) {
      router.replace("/auth");
    } else if (user && inAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [initialized, user, segments, router]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.cream },
            animation: "fade",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="quiz" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="results" options={{ animation: "slide_from_right" }} />
          <Stack.Screen
            name="share"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
