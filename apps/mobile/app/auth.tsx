import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/lib/stores/authStore";
import { useI18n } from "@/lib/i18n";
import { colors, radius, spacing, type } from "@/lib/theme";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === "signup" && !name.trim()) return;

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          Alert.alert(t.common.error, error.message);
        } else {
          router.replace("/(tabs)");
        }
      } else {
        const { error } = await signUp(email.trim(), password, name.trim());
        if (error) {
          Alert.alert(t.common.error, error.message);
        } else {
          Alert.alert(t.auth.signup, t.auth.signup_success);
          setMode("signin");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={type.eyebrow}>GIFT DN-AI</Text>
            <Text style={styles.title}>
              {t.auth.title_a}{"\n"}
              <Text style={styles.titleAccent}>{t.auth.title_b}</Text>
            </Text>
            <Text style={styles.sub}>{t.auth.sub}</Text>
          </View>

          <View style={styles.form}>
            {mode === "signup" && (
              <View style={styles.field}>
                <Text style={styles.label}>{t.auth.name}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholder=""
                  placeholderTextColor={colors.muted2}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>{t.auth.email}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder=""
                placeholderTextColor={colors.muted2}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t.auth.pass}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholder=""
                placeholderTextColor={colors.muted2}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </View>

            <View style={{ height: spacing.sm }} />
            <Button
              label={mode === "signin" ? t.auth.signin : t.auth.signup}
              onPress={submit}
              loading={loading}
            />

            <Pressable
              onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
              style={styles.switchRow}
            >
              <Text style={styles.switchText}>
                {mode === "signin" ? t.auth.noaccount : t.auth.haveaccount}{" "}
                <Text style={styles.switchAccent}>
                  {mode === "signin" ? t.auth.signup : t.auth.signin}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
    fontWeight: "500",
    letterSpacing: -0.4,
    marginTop: spacing.sm,
  },
  titleAccent: {
    color: colors.coral,
  },
  sub: {
    fontSize: 15,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...type.label,
  },
  input: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  switchRow: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    color: colors.muted,
  },
  switchAccent: {
    color: colors.coral,
    fontWeight: "600",
  },
});
