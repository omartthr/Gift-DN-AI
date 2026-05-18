import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Loader } from "@/components/Loader";
import { useI18n, type Translations } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { useQuizStore } from "@/lib/stores/quizStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { colors, radius, spacing, type } from "@/lib/theme";
import type { GiftSuggestion } from "@/lib/types";

export default function ResultsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const gifts = useQuizStore((s) => s.gifts);
  const session = useQuizStore((s) => s.session);
  const loadingMore = useQuizStore((s) => s.loadingMore);
  const loadMoreGifts = useQuizStore((s) => s.loadMoreGifts);
  const reset = useQuizStore((s) => s.reset);
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const wishlistItems = useWishlistStore((s) => s.items);

  const onSave = async (gift: GiftSuggestion) => {
    if (!user) return;
    if (wishlistItems.some((w) => w.product_name === gift.product_name)) return;
    const ok = await addToWishlist(user.id, {
      product_name: gift.product_name,
      product_link: gift.product_link,
      product_image: gift.product_image,
      product_description: gift.product_description,
      reasoning: gift.reasoning,
      current_price: gift.current_price,
      source_store: gift.source_store,
      source_icon: gift.source_icon || "",
      rating: gift.rating ?? null,
      thumbnails: gift.thumbnails || [],
      tone: "",
      note: "",
    });
    if (!ok) Alert.alert(t.common.error);
  };

  const onShare = (gift: GiftSuggestion) => {
    router.push({
      pathname: "/share",
      params: {
        product_name: gift.product_name,
        product_image: gift.product_image,
        product_link: gift.product_link,
        suggestion_id: gift.id || "",
        session_id: session?.id || "",
      },
    });
  };

  const restart = () => {
    reset();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerBar}>
        <Pressable onPress={restart} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.ink2} />
        </Pressable>
        <Text style={type.eyebrow}>{t.results.eyebrow}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>
          {t.results.title_a}{" "}
          <Text style={{ color: colors.coral }}>{t.results.title_b}</Text>
        </Text>
        <Text style={styles.sub}>{t.results.sub}</Text>

        <View style={{ height: spacing.xl }} />

        {gifts.length === 0 && (
          <Card>
            <Text style={styles.empty}>{t.results.more_empty}</Text>
          </Card>
        )}

        {gifts.map((g) => (
          <GiftCard
            key={(g.id || g.product_name) + g.rank}
            gift={g}
            saved={wishlistItems.some((w) => w.product_name === g.product_name)}
            onSave={() => onSave(g)}
            onShare={() => onShare(g)}
            t={t}
          />
        ))}

        {loadingMore ? (
          <Loader label={t.results.more_loading} />
        ) : (
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label={t.results.more} onPress={loadMoreGifts} variant="outline" />
            <Text style={[type.tiny, { textAlign: "center" }]}>{t.results.more_hint}</Text>
          </View>
        )}

        <View style={{ height: spacing.lg }} />
        <Button label={t.results.restart} onPress={restart} variant="ghost" />
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GiftCard({
  gift,
  saved,
  onSave,
  onShare,
  t,
}: {
  gift: GiftSuggestion;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  t: Translations;
}) {
  const openProduct = async () => {
    if (gift.product_link) await WebBrowser.openBrowserAsync(gift.product_link);
  };

  return (
    <Card style={styles.giftCard}>
      <View style={styles.rankRow}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{gift.rank}</Text>
        </View>
        <Text style={type.eyebrow}>{t.results.rank}</Text>
      </View>

      {gift.product_image ? (
        <Pressable onPress={openProduct}>
          <Image
            source={{ uri: gift.product_image }}
            style={styles.giftImage}
            contentFit="cover"
          />
        </Pressable>
      ) : null}

      <Text style={styles.giftName}>{gift.product_name}</Text>

      {gift.product_description ? (
        <Text style={styles.giftDesc}>{gift.product_description}</Text>
      ) : null}

      <View style={styles.metaRow}>
        {gift.current_price ? (
          <View style={styles.metaItem}>
            <Text style={type.tiny}>{t.results.price}</Text>
            <Text style={styles.metaValue}>{gift.current_price}</Text>
          </View>
        ) : null}
        {gift.source_store ? (
          <View style={styles.metaItem}>
            <Text style={type.tiny}>{t.results.from}</Text>
            <Text style={styles.metaValue}>{gift.source_store}</Text>
          </View>
        ) : null}
      </View>

      {gift.reasoning ? (
        <View style={styles.reasonBox}>
          <Text style={type.eyebrow}>{t.results.why}</Text>
          <Text style={styles.reasonText}>{gift.reasoning}</Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Button
          label={t.results.view}
          onPress={openProduct}
          small
          rightIcon={<Ionicons name="open-outline" size={14} color="#FFF" />}
          style={{ flex: 1 }}
        />
      </View>

      <View style={styles.subActionsRow}>
        <Pressable
          onPress={onSave}
          disabled={saved}
          style={({ pressed }) => [styles.subAction, pressed && { opacity: 0.7 }]}
        >
          <Ionicons
            name={saved ? "checkmark" : "heart-outline"}
            size={16}
            color={saved ? colors.sage : colors.ink2}
          />
          <Text style={[styles.subActionText, saved && { color: colors.sage }]}>
            {saved ? t.results.saved : t.results.wishlist}
          </Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          style={({ pressed }) => [styles.subAction, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="share-social-outline" size={16} color={colors.ink2} />
          <Text style={styles.subActionText}>{t.results.share}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  scroll: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    fontWeight: "500",
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 15,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    paddingVertical: spacing.xl,
  },
  giftCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  giftImage: {
    width: "100%",
    height: 220,
    borderRadius: radius.sm,
    backgroundColor: colors.cream2,
  },
  giftName: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  giftDesc: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  metaItem: {
    gap: 2,
  },
  metaValue: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: "600",
  },
  reasonBox: {
    backgroundColor: colors.cream2,
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  reasonText: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  subActionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.ruleSoft,
  },
  subAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  subActionText: {
    fontSize: 13,
    color: colors.ink2,
    fontWeight: "500",
  },
});
