import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";
import { randomFact, randomStory } from "@/lib/loadingContent";
import { useI18n } from "@/lib/i18n";

interface Props {
  label?: string;
  steps?: string[];
  trivia?: boolean;
}

const CYCLE_MS = 6000;

export function Loader({ label, steps, trivia }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dotsRow}>
        <Dots />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>

      {trivia ? <TriviaBlock /> : null}

      {steps && steps.length > 0 ? (
        <View style={styles.steps}>
          {steps.map((s, i) => (
            <Text key={i} style={styles.step}>
              · {s}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TriviaBlock() {
  const { t } = useI18n();
  const [story, setStory] = useState<string>(() => randomStory());
  const [fact, setFact] = useState<string>(() => randomFact());
  const storyOpacity = useRef(new Animated.Value(1)).current;
  const factOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // fade out → swap → fade in
      Animated.timing(storyOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setStory(randomStory());
        Animated.timing(storyOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }).start();
      });

      Animated.timing(factOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setFact(randomFact());
        Animated.timing(factOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }).start();
      });
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [storyOpacity, factOpacity]);

  return (
    <View style={styles.trivia}>
      <Animated.Text style={[styles.story, { opacity: storyOpacity }]}>
        {story}
      </Animated.Text>

      <View style={styles.factCard}>
        <Text style={styles.factEyebrow}>{t.loading.did_you_know}</Text>
        <Animated.Text style={[styles.factText, { opacity: factOpacity }]}>
          {fact}
        </Animated.Text>
      </View>
    </View>
  );
}

function Dots() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

    const animations = [loop(a, 0), loop(b, 200), loop(c, 400)];
    animations.forEach((x) => x.start());
    return () => animations.forEach((x) => x.stop());
  }, [a, b, c]);

  const dotStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }) }],
  });

  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, dotStyle(a)]} />
      <Animated.View style={[styles.dot, dotStyle(b)]} />
      <Animated.View style={[styles.dot, dotStyle(c)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    width: "100%",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  trivia: {
    width: "100%",
    maxWidth: 480,
    gap: spacing.xl,
    alignItems: "center",
  },
  story: {
    fontSize: 20,
    lineHeight: 28,
    color: colors.coral,
    fontWeight: "500",
    letterSpacing: -0.2,
    textAlign: "center",
    minHeight: 56,
  },
  factCard: {
    width: "100%",
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  factEyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  factText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink2,
  },
  steps: {
    marginTop: spacing.md,
    gap: spacing.xs,
    alignItems: "center",
  },
  step: {
    fontSize: 12,
    color: colors.muted2,
    letterSpacing: 0.2,
  },
});
