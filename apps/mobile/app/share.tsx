import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCommunityStore } from "@/lib/stores/communityStore";
import { colors, radius, spacing, type } from "@/lib/theme";

export default function ShareScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{
    product_name?: string;
    product_image?: string;
    product_link?: string;
    suggestion_id?: string;
    session_id?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const createPost = useCommunityStore((s) => s.createPost);

  const [recipient, setRecipient] = useState("");
  const [feedback, setFeedback] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!user || !feedback.trim()) return;
    setPosting(true);
    const ok = await createPost({
      user_id: user.id,
      session_id: params.session_id || null,
      suggestion_id: params.suggestion_id || null,
      product_name: params.product_name || "",
      product_image: params.product_image || "",
      product_link: params.product_link || "",
      feedback_text: feedback.trim(),
      recipient_label: recipient.trim(),
      is_anonymous: anonymous,
    });
    setPosting(false);
    if (ok) {
      router.back();
    } else {
      Alert.alert(t.common.error);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.ink2} />
        </Pressable>
        <Text style={type.eyebrow}>{t.share.title}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sub}>{t.share.sub}</Text>

          <View style={styles.productPreview}>
            {params.product_image ? (
              <Image
                source={{ uri: params.product_image }}
                style={styles.previewImage}
                contentFit="cover"
              />
            ) : null}
            <Text style={styles.previewName} numberOfLines={2}>
              {params.product_name}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={type.label}>{t.share.recipient}</Text>
            <TextInput
              value={recipient}
              onChangeText={setRecipient}
              style={styles.input}
              placeholder={t.share.recipient}
              placeholderTextColor={colors.muted2}
            />
          </View>

          <View style={styles.field}>
            <Text style={type.label}>{t.share.feedback}</Text>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              style={[styles.input, styles.textarea]}
              placeholder={t.share.feedback}
              placeholderTextColor={colors.muted2}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t.share.anon}</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ false: colors.rule, true: colors.coral }}
            />
          </View>

          <View style={{ height: spacing.xl }} />
          <Button
            label={t.share.post}
            onPress={submit}
            loading={posting}
            disabled={!feedback.trim()}
          />
          <View style={{ height: spacing.sm }} />
          <Button label={t.share.cancel} onPress={() => router.back()} variant="ghost" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  sub: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  productPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.cream2,
  },
  previewName: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    fontWeight: "500",
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
  },
  textarea: {
    minHeight: 120,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.ink2,
    fontWeight: "500",
  },
});
