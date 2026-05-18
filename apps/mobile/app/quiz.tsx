import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Loader } from "@/components/Loader";
import { PaywallModal } from "@/components/PaywallModal";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { useQuizStore } from "@/lib/stores/quizStore";
import { colors, radius, spacing, type } from "@/lib/theme";

const RECIPIENT_KEYS = [
  "partner",
  "mom",
  "dad",
  "friend",
  "sibling",
  "coworker",
  "child",
  "other",
] as const;

const BUDGET_KEYS = ["b1", "b2", "b3", "b4", "b5"] as const;

export default function QuizScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const user = useAuthStore((s) => s.user);
  const {
    phase,
    chips,
    currentQuestion,
    error,
    paywallBlocked,
    setChips,
    startSession,
    submitAnswer,
    dismissPaywall,
    reset,
  } = useQuizStore();

  // Local chips builder state
  const [recipient, setRecipient] = useState<string | null>(null);
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [budget, setBudget] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    if (phase === "results") {
      router.replace("/results");
    }
  }, [phase, router]);

  useEffect(() => {
    if (error) Alert.alert(t.common.error, error);
  }, [error, t.common.error]);

  // Reset local choice state when question changes
  useEffect(() => {
    setTextAnswer("");
    setChosen([]);
  }, [currentQuestion?.turn]);

  const canStart = !!recipient && !!budget;

  const beginQuiz = async () => {
    if (!user || !recipient || !budget) return;
    setChips({
      recipients: [recipient],
      budget,
      recipientGender: gender,
    });
    await startSession(user.id, lang);
  };

  const submit = async () => {
    if (!currentQuestion) return;
    let answer = "";
    if (currentQuestion.question_type === "text") {
      answer = textAnswer.trim();
    } else if (currentQuestion.question_type === "single_choice") {
      answer = chosen[0] || "";
    } else if (currentQuestion.question_type === "multi_choice") {
      answer = chosen.join(", ");
    }
    if (!answer) return;
    await submitAnswer(answer);
  };

  const toggleChosen = (opt: string, multi: boolean) => {
    if (multi) {
      setChosen((prev) =>
        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
      );
    } else {
      setChosen([opt]);
    }
  };

  const exit = () => {
    reset();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerBar}>
        <Pressable onPress={exit} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.ink2} />
        </Pressable>
        <Text style={type.eyebrow}>
          {phase === "chips" ? t.onboarding.eyebrow : t.quiz.eyebrow}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {phase === "chips" && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {t.onboarding.title_a}{" "}
              <Text style={{ color: colors.coral }}>{t.onboarding.title_b}</Text>
            </Text>
            <Text style={styles.sub}>{t.onboarding.sub}</Text>

            <Text style={[type.label, { marginTop: spacing.xl }]}>{t.onboarding.q1}</Text>
            <Text style={styles.hint}>{t.onboarding.q1_hint}</Text>
            <View style={styles.chipWrap}>
              {RECIPIENT_KEYS.map((key) => (
                <Chip
                  key={key}
                  label={t.recipients[key]}
                  selected={recipient === key}
                  onPress={() => setRecipient(key)}
                />
              ))}
            </View>

            <Text style={[type.label, { marginTop: spacing.xl }]}>{t.onboarding.q_gender}</Text>
            <Text style={styles.hint}>{t.onboarding.q_gender_hint}</Text>
            <View style={styles.chipWrap}>
              <Chip
                label={t.onboarding.gender_female}
                selected={gender === "female"}
                onPress={() => setGender(gender === "female" ? undefined : "female")}
              />
              <Chip
                label={t.onboarding.gender_male}
                selected={gender === "male"}
                onPress={() => setGender(gender === "male" ? undefined : "male")}
              />
              <Chip
                label={t.onboarding.gender_nonbinary}
                selected={gender === "nonbinary"}
                onPress={() => setGender(gender === "nonbinary" ? undefined : "nonbinary")}
              />
            </View>

            <Text style={[type.label, { marginTop: spacing.xl }]}>{t.onboarding.q2}</Text>
            <Text style={styles.hint}>{t.onboarding.q2_hint}</Text>
            <View style={styles.chipWrap}>
              {BUDGET_KEYS.map((key) => (
                <Chip
                  key={key}
                  label={t.budget[key]}
                  selected={budget === key}
                  onPress={() => setBudget(key)}
                />
              ))}
            </View>

            <View style={{ height: spacing.xl }} />
            <Button
              label={t.onboarding.cont}
              onPress={beginQuiz}
              disabled={!canStart}
            />
            <View style={{ height: spacing.xxxl }} />
          </ScrollView>
        )}

        {(phase === "loading" || phase === "generating") && (
          <ScrollView contentContainerStyle={styles.loaderScroll}>
            <Loader
              label={phase === "loading" ? t.quiz.thinking : t.quiz.finalizing}
              steps={phase === "generating" ? t.quiz.steps : undefined}
              trivia
            />
          </ScrollView>
        )}

        {phase === "quiz" && currentQuestion && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.progressRow}>
              <Text style={type.label}>
                {t.quiz.turn} {currentQuestion.turn} {t.quiz.of}
              </Text>
              <Text style={[type.label, { color: colors.coral }]}>
                {Math.round((currentQuestion.confidence_score || 0) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.round((currentQuestion.confidence_score || 0) * 100))}%` },
                ]}
              />
            </View>

            <View style={{ height: spacing.xl }} />

            <Card>
              <Text style={type.eyebrow}>{t.quiz.ai_question}</Text>
              <Text style={styles.question}>{currentQuestion.question}</Text>
              {currentQuestion.reasoning ? (
                <>
                  <View style={styles.reasoningDivider} />
                  <Text style={type.eyebrow}>{t.quiz.reasoning}</Text>
                  <Text style={styles.reasoning}>{currentQuestion.reasoning}</Text>
                </>
              ) : null}
            </Card>

            <View style={{ height: spacing.lg }} />

            {currentQuestion.question_type === "text" && (
              <TextInput
                value={textAnswer}
                onChangeText={setTextAnswer}
                placeholder={t.quiz.placeholder}
                placeholderTextColor={colors.muted2}
                style={styles.textInput}
                multiline
                onSubmitEditing={submit}
                returnKeyType="send"
              />
            )}

            {currentQuestion.question_type !== "text" && currentQuestion.options && (
              <View style={styles.optionsWrap}>
                {currentQuestion.options.map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() =>
                      toggleChosen(opt, currentQuestion.question_type === "multi_choice")
                    }
                    style={({ pressed }) => [
                      styles.option,
                      chosen.includes(opt) && styles.optionSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons
                      name={
                        chosen.includes(opt)
                          ? currentQuestion.question_type === "multi_choice"
                            ? "checkbox"
                            : "radio-button-on"
                          : currentQuestion.question_type === "multi_choice"
                          ? "square-outline"
                          : "radio-button-off"
                      }
                      size={20}
                      color={chosen.includes(opt) ? colors.coral : colors.muted2}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        chosen.includes(opt) && { color: colors.ink, fontWeight: "500" },
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={{ height: spacing.lg }} />
            <Button
              label={t.quiz.submit}
              onPress={submit}
              disabled={
                currentQuestion.question_type === "text"
                  ? textAnswer.trim().length === 0
                  : chosen.length === 0
              }
            />
            <View style={{ height: spacing.xxxl }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <PaywallModal
        visible={paywallBlocked}
        onClose={() => {
          dismissPaywall();
          router.back();
        }}
      />
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
    backgroundColor: colors.cream,
  },
  scroll: {
    padding: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loaderScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
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
  hint: {
    fontSize: 12,
    color: colors.muted2,
    marginTop: 2,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.ruleSoft,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.coral,
    borderRadius: 2,
  },
  question: {
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
    fontWeight: "500",
    marginTop: spacing.sm,
    letterSpacing: -0.2,
  },
  reasoningDivider: {
    height: 1,
    backgroundColor: colors.ruleSoft,
    marginVertical: spacing.md,
  },
  reasoning: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionsWrap: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionSelected: {
    borderColor: colors.coral,
    backgroundColor: "#FFF6F2",
  },
  optionText: {
    fontSize: 15,
    color: colors.ink2,
    flex: 1,
  },
});
