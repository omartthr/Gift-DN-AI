import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWishlistStore, type WishlistRow } from "@/lib/stores/wishlistStore";
import { colors, radius, spacing, type } from "@/lib/theme";

export default function WishlistTab() {
  const { t } = useI18n();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items, loading, fetched, fetchItems, removeItem, updateNote, resetLocal } =
    useWishlistStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchItems(user.id);
  }, [user, fetchItems]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    resetLocal();
    await fetchItems(user.id);
    setRefreshing(false);
  };

  const onRemove = (item: WishlistRow) => {
    Alert.alert(item.product_name, t.wishlist.remove + "?", [
      { text: t.common.cancel, style: "cancel" },
      { text: t.wishlist.remove, style: "destructive", onPress: () => removeItem(item.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(it) => it.id}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <ScreenHeader
              eyebrow={`${t.wishlist.eyebrow} · ${items.length} ${t.wishlist.items}`}
              titleA={t.wishlist.title_a}
              titleB={t.wishlist.title_b}
            />
          </View>
        }
        ListEmptyComponent={
          !loading && fetched ? (
            <Card style={styles.empty}>
              <Ionicons name="heart-outline" size={28} color={colors.muted2} />
              <Text style={styles.emptyTitle}>{t.wishlist.empty_a}</Text>
              <Text style={styles.emptyBody}>{t.wishlist.empty_b}</Text>
              <View style={{ height: spacing.md }} />
              <Button
                label={t.wishlist.empty_cta}
                onPress={() => router.push("/(tabs)")}
                small
                fullWidth={false}
              />
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <WishlistItem
            item={item}
            onRemove={() => onRemove(item)}
            onNoteChange={(note) => updateNote(item.id, note)}
            viewLabel={t.wishlist.view}
            noteHint={t.wishlist.note}
            removeLabel={t.wishlist.remove}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.coral}
          />
        }
      />
    </SafeAreaView>
  );
}

function WishlistItem({
  item,
  onRemove,
  onNoteChange,
  viewLabel,
  noteHint,
  removeLabel,
}: {
  item: WishlistRow;
  onRemove: () => void;
  onNoteChange: (note: string) => void;
  viewLabel: string;
  noteHint: string;
  removeLabel: string;
}) {
  const [note, setNote] = useState(item.note || "");

  const openLink = async () => {
    if (!item.product_link) return;
    await WebBrowser.openBrowserAsync(item.product_link);
  };

  return (
    <Card style={styles.item}>
      <View style={styles.itemRow}>
        {item.product_image ? (
          <Image source={{ uri: item.product_image }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="gift" size={24} color={colors.muted2} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.product_name}
          </Text>
          {item.current_price ? (
            <Text style={styles.itemPrice}>{item.current_price}</Text>
          ) : null}
          {item.source_store ? (
            <Text style={styles.itemSource}>{item.source_store}</Text>
          ) : null}
        </View>
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        onEndEditing={() => onNoteChange(note)}
        placeholder={noteHint}
        placeholderTextColor={colors.muted2}
        style={styles.noteInput}
        multiline
      />

      <View style={styles.actions}>
        <Pressable onPress={openLink} style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="open-outline" size={16} color={colors.coral} />
          <Text style={styles.linkText}>{viewLabel}</Text>
        </Pressable>
        <Pressable onPress={onRemove} style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="trash-outline" size={16} color={colors.muted} />
          <Text style={styles.removeText}>{removeLabel}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  list: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  item: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.cream2,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.coral,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  itemSource: {
    fontSize: 11,
    color: colors.muted2,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  noteInput: {
    backgroundColor: colors.cream2,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.ink2,
    minHeight: 48,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 13,
    color: colors.coral,
    fontWeight: "600",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  removeText: {
    fontSize: 13,
    color: colors.muted,
  },
});
