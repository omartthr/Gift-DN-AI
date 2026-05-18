import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "@/lib/theme";

interface Props {
  eyebrow?: string;
  titleA?: string;
  titleB?: string;
  subtitle?: string;
}

export function ScreenHeader({ eyebrow, titleA, titleB, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={type.eyebrow}>{eyebrow}</Text> : null}
      {(titleA || titleB) ? (
        <Text style={styles.title}>
          {titleA}
          {titleA && titleB ? "\n" : null}
          <Text style={styles.titleAccent}>{titleB}</Text>
        </Text>
      ) : null}
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    fontWeight: "500",
    letterSpacing: -0.4,
    marginTop: spacing.xs,
  },
  titleAccent: {
    color: colors.coral,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
