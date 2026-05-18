import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radius } from "@/lib/theme";

interface Props extends ViewProps {
  padded?: boolean;
}

export function Card({ style, padded = true, ...rest }: Props) {
  return <View {...rest} style={[styles.card, padded && styles.padded, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bone,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  padded: {
    padding: 16,
  },
});
