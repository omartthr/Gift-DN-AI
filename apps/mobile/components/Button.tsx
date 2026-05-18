import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

type Variant = "coral" | "ink" | "outline" | "ghost";

interface Props extends Omit<PressableProps, "style" | "children"> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  small?: boolean;
}

export function Button({
  label,
  variant = "coral",
  loading,
  disabled,
  fullWidth = true,
  style,
  leftIcon,
  rightIcon,
  small,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        variantStyles[variant].container,
        fullWidth && { alignSelf: "stretch" },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} />
      ) : (
        <View style={styles.row}>
          {leftIcon}
          <Text style={[styles.text, small && styles.textSmall, variantStyles[variant].text]}>
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 13,
  },
});

const variantStyles = {
  coral: {
    container: { backgroundColor: colors.coral },
    text: { color: "#FFFFFF" },
  },
  ink: {
    container: { backgroundColor: colors.ink },
    text: { color: "#FFFFFF" },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.rule,
    },
    text: { color: colors.ink },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: colors.ink2 },
  },
} as const;
