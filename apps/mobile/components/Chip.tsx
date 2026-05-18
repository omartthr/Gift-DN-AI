import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "@/lib/theme";

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
}

export function Chip({ label, selected, onPress, small }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          { color: selected ? "#FFFFFF" : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  unselected: {
    backgroundColor: colors.bone,
    borderColor: colors.rule,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  labelSmall: {
    fontSize: 12,
  },
});
