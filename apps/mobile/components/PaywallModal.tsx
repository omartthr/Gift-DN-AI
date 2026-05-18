import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { colors, radius, spacing, type } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { WEB_URL } from "@/lib/supabase";
import { Button } from "./Button";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: Props) {
  const { t } = useI18n();

  const openWeb = async () => {
    await WebBrowser.openBrowserAsync(`${WEB_URL}/pricing`);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={type.eyebrow}>PREMIUM</Text>
          <Text style={styles.title}>{t.paywall.title}</Text>
          <Text style={styles.body}>{t.paywall.body}</Text>

          <View style={{ height: spacing.lg }} />
          <Button label={t.paywall.cta} onPress={openWeb} variant="coral" />
          <View style={{ height: spacing.sm }} />
          <Button label={t.paywall.cancel} onPress={onClose} variant="ghost" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9,9,11,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: 24,
    fontWeight: "500",
    color: colors.ink,
    marginTop: spacing.sm,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
