import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useI18n } from "@/lib/i18n";
import { colors, spacing, type } from "@/lib/theme";
import { useQuizStore } from "@/lib/stores/quizStore";

export default function HomeTab() {
  const { t } = useI18n();
  const router = useRouter();
  const reset = useQuizStore((s) => s.reset);

  const start = () => {
    reset();
    router.push("/quiz");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={type.eyebrow}>{t.landing.eyebrow}</Text>
        <Text style={styles.title}>
          {t.landing.h1_a}
          {"\n"}
          <Text style={styles.titleAccent}>{t.landing.h1_b}</Text>
          {"\n"}
          {t.landing.h1_c}
        </Text>
        <Text style={styles.sub}>{t.landing.sub}</Text>

        <View style={{ height: spacing.xl }} />
        <Button label={t.landing.cta_start} onPress={start} />
        <View style={{ height: spacing.sm }} />
        <Button
          label={t.landing.cta_explore}
          onPress={() => router.push("/(tabs)/community")}
          variant="outline"
        />

        <View style={{ height: spacing.xxxl }} />

        <Step
          eyebrow={t.landing.step1_eye}
          title={t.landing.step1}
          icon="options-outline"
        />
        <Step
          eyebrow={t.landing.step2_eye}
          title={t.landing.step2}
          icon="chatbubbles-outline"
        />
        <Step
          eyebrow={t.landing.step3_eye}
          title={t.landing.step3}
          icon="gift-outline"
        />

        <View style={{ height: spacing.xl }} />

        <Card style={styles.manifesto}>
          <Text style={type.eyebrow}>{t.landing.manifesto_eye}</Text>
          <Text style={styles.manifestoBody}>{t.landing.manifesto}</Text>
          <Text style={styles.signed}>{t.landing.signed}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: any }) {
  return (
    <Card style={styles.step}>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={20} color={colors.coral} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.eyebrow}>{eyebrow}</Text>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    fontWeight: "500",
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  titleAccent: {
    color: colors.coral,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginTop: spacing.md,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FBE9E3",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 16,
    color: colors.ink,
    fontWeight: "500",
    marginTop: 2,
  },
  manifesto: {
    backgroundColor: colors.cream2,
    borderColor: colors.ruleSoft,
  },
  manifestoBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink2,
    marginTop: spacing.sm,
  },
  signed: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.md,
    fontStyle: "italic",
  },
});
