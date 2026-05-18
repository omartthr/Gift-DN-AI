import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { useCommunityStore } from "@/lib/stores/communityStore";
import { WEB_URL } from "@/lib/supabase";
import { colors, radius, spacing, type } from "@/lib/theme";

export default function ProfileTab() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const resetWishlist = useWishlistStore((s) => s.resetLocal);
  const resetCommunity = useCommunityStore((s) => s.resetLocal);
  const [signingOut, setSigningOut] = useState(false);

  const isPremium = profile?.subscription_status === "active";

  const onLogout = () => {
    Alert.alert(t.nav.logout, t.nav.logout + "?", [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.nav.logout,
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          resetWishlist();
          resetCommunity();
          await signOut();
          router.replace("/auth");
          setSigningOut(false);
        },
      },
    ]);
  };

  const upgrade = async () => {
    await WebBrowser.openBrowserAsync(`${WEB_URL}/pricing`);
  };

  const memberDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          eyebrow={t.profile.eyebrow}
          titleA={profile?.full_name || user?.email?.split("@")[0] || ""}
        />

        <Card style={styles.account}>
          <View style={styles.accountRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.full_name || user?.email || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.email}>{user?.email}</Text>
              {memberDate ? (
                <Text style={styles.meta}>
                  {t.profile.member_since}: {memberDate}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.planRow}>
            <Ionicons
              name={isPremium ? "star" : "star-outline"}
              size={18}
              color={isPremium ? colors.coral : colors.muted}
            />
            <Text style={[styles.planText, isPremium && { color: colors.coral, fontWeight: "600" }]}>
              {isPremium ? t.profile.premium : t.profile.free}
            </Text>
          </View>
        </Card>

        {!isPremium && (
          <Card style={styles.paywallCard}>
            <Text style={type.eyebrow}>PREMIUM</Text>
            <Text style={styles.paywallTitle}>{t.profile.paywall_title}</Text>
            <Text style={styles.paywallBody}>{t.profile.paywall_body}</Text>
            <View style={{ height: spacing.md }} />
            <Button label={t.profile.paywall_cta} onPress={upgrade} small fullWidth={false} />
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={type.label}>{t.profile.language}</Text>
          <View style={styles.langRow}>
            <LangOption
              label="Türkçe"
              code="TR"
              active={lang === "tr"}
              onPress={() => setLang("tr")}
            />
            <LangOption
              label="English"
              code="EN"
              active={lang === "en"}
              onPress={() => setLang("en")}
            />
          </View>
        </Card>

        <View style={{ height: spacing.lg }} />
        <Button
          label={t.nav.logout}
          onPress={onLogout}
          variant="outline"
          loading={signingOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function LangOption({
  label,
  code,
  active,
  onPress,
}: {
  label: string;
  code: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.langOption,
        active && styles.langOptionActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.langCode, active && { color: "#FFF" }]}>{code}</Text>
      <Text style={[styles.langLabel, active && { color: "#FFF" }]}>{label}</Text>
      {active ? <Ionicons name="checkmark" size={16} color="#FFF" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  account: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "600",
  },
  email: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "500",
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.ruleSoft,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  planText: {
    fontSize: 14,
    color: colors.ink2,
  },
  paywallCard: {
    backgroundColor: colors.cream2,
    borderColor: colors.ruleSoft,
    marginBottom: spacing.md,
  },
  paywallTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.ink,
    marginTop: spacing.sm,
    letterSpacing: -0.2,
  },
  paywallBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  langRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  langOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.bone,
  },
  langOptionActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  langCode: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  langLabel: {
    fontSize: 14,
    color: colors.ink,
    flex: 1,
  },
});
