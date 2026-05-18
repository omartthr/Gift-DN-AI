import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { useI18n, type Translations } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  useCommunityStore,
  type DbCommunityPost,
} from "@/lib/stores/communityStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { colors, radius, spacing, type } from "@/lib/theme";

type SortKey = "new" | "top";

export default function CommunityTab() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const {
    dbPosts,
    loading,
    fetched,
    userLikes,
    fetchPosts,
    fetchUserLikes,
    toggleLike,
  } = useCommunityStore();
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const wishlistItems = useWishlistStore((s) => s.items);

  const [sort, setSort] = useState<SortKey>("new");
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
    if (user) fetchUserLikes(user.id);
  }, [user, fetchPosts, fetchUserLikes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(true);
    if (user) await fetchUserLikes(user.id);
    setRefreshing(false);
  };

  const recipientFilters = useMemo(() => {
    const set = new Set<string>();
    dbPosts.forEach((p) => p.recipient_label && set.add(p.recipient_label));
    return ["all", ...Array.from(set)];
  }, [dbPosts]);

  const visible = useMemo(() => {
    let arr = [...dbPosts];
    if (filter !== "all") arr = arr.filter((p) => p.recipient_label === filter);
    if (sort === "new") {
      arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else {
      arr.sort((a, b) => b.likes_count - a.likes_count);
    }
    return arr;
  }, [dbPosts, sort, filter]);

  const onSave = async (p: DbCommunityPost) => {
    if (!user) return;
    if (wishlistItems.some((w) => w.product_name === p.product_name)) return;
    await addToWishlist(user.id, {
      product_name: p.product_name,
      product_link: p.product_link,
      product_image: p.product_image,
      product_description: p.feedback_text,
      reasoning: "",
      current_price: "",
      source_store: "",
      source_icon: "",
      rating: null,
      thumbnails: [],
      tone: "",
      note: "",
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <ScreenHeader
              eyebrow={t.community.eyebrow}
              titleA={t.community.title_a}
              titleB={t.community.title_b}
              subtitle={t.community.sub}
            />

            <View style={styles.controls}>
              <Text style={type.label}>{t.community.sort}</Text>
              <View style={styles.chipRow}>
                <Chip
                  label={t.community.sort_new}
                  selected={sort === "new"}
                  onPress={() => setSort("new")}
                  small
                />
                <Chip
                  label={t.community.sort_top}
                  selected={sort === "top"}
                  onPress={() => setSort("top")}
                  small
                />
              </View>

              {recipientFilters.length > 1 && (
                <>
                  <Text style={[type.label, { marginTop: spacing.md }]}>
                    {t.community.filter}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {recipientFilters.map((r) => (
                      <Chip
                        key={r}
                        label={r === "all" ? t.community.all : r}
                        selected={filter === r}
                        onPress={() => setFilter(r)}
                        small
                      />
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading && fetched ? (
            <Card style={styles.empty}>
              <Ionicons name="people-outline" size={28} color={colors.muted2} />
              <Text style={styles.emptyText}>{t.community.empty}</Text>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            liked={userLikes.has(item.id)}
            onLike={() => user && toggleLike(item.id, user.id)}
            onSave={() => onSave(item)}
            saved={wishlistItems.some((w) => w.product_name === item.product_name)}
            t={t}
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

function PostCard({
  post,
  liked,
  onLike,
  onSave,
  saved,
  t,
}: {
  post: DbCommunityPost;
  liked: boolean;
  onLike: () => void;
  onSave: () => void;
  saved: boolean;
  t: Translations;
}) {
  const author = post.is_anonymous
    ? t.community.anon
    : post.profiles?.full_name || t.community.anon;

  const open = async () => {
    if (post.product_link) await WebBrowser.openBrowserAsync(post.product_link);
  };

  return (
    <Card style={styles.post}>
      <View style={styles.postHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{author.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{author}</Text>
          {post.recipient_label ? (
            <Text style={styles.recipient}>
              {t.community.for} {post.recipient_label}
            </Text>
          ) : null}
        </View>
      </View>

      {post.product_image ? (
        <Pressable onPress={open}>
          <Image
            source={{ uri: post.product_image }}
            style={styles.postImage}
            contentFit="cover"
          />
        </Pressable>
      ) : null}

      <Text style={styles.productName} numberOfLines={2}>
        {post.product_name}
      </Text>
      {post.feedback_text ? (
        <Text style={styles.feedback}>{post.feedback_text}</Text>
      ) : null}

      <View style={styles.postActions}>
        <Pressable onPress={onLike} style={styles.iconBtn}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={20}
            color={liked ? colors.coral : colors.muted}
          />
          <Text style={[styles.iconLabel, liked && { color: colors.coral }]}>
            {post.likes_count}
          </Text>
        </Pressable>

        <Pressable onPress={onSave} disabled={saved} style={styles.saveBtn}>
          <Ionicons
            name={saved ? "checkmark" : "bookmark-outline"}
            size={16}
            color={saved ? colors.sage : colors.ink2}
          />
          <Text style={[styles.saveText, saved && { color: colors.sage }]}>
            {saved ? t.community.saved : t.community.add_wish}
          </Text>
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
  controls: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: "center",
  },
  post: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  postHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink2,
  },
  author: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.ink,
  },
  recipient: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: radius.sm,
    backgroundColor: colors.cream2,
  },
  productName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
    lineHeight: 20,
  },
  feedback: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink2,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.ruleSoft,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  iconLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.cream2,
  },
  saveText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.ink2,
  },
});
