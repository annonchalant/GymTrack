// Date selector: prev / current date / next, plus a "Today" jump.
// Uses a single `dateKey` (YYYY-MM-DD) prop so parent owns state.

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  addDays,
  formatDateLong,
  fromDateKey,
  toDateKey,
} from "@/src/utils/cycle";
import { colors, radius, spacing, typography } from "@/src/theme/colors";

type Props = {
  dateKey: string;
  onChange: (next: string) => void;
};

export default function DateBar({ dateKey, onChange }: Props) {
  const current = fromDateKey(dateKey);
  const todayKey = toDateKey(new Date());
  const isToday = dateKey === todayKey;

  const goPrev = () => onChange(toDateKey(addDays(current, -1)));
  const goNext = () => onChange(toDateKey(addDays(current, 1)));
  const goToday = () => onChange(todayKey);

  return (
    <View style={styles.row} testID="date-bar">
      <TouchableOpacity
        onPress={goPrev}
        style={styles.arrowBtn}
        accessibilityLabel="Previous day"
        testID="date-prev-button"
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.dateLabel} testID="date-label">
          {isToday ? "Today" : formatDateLong(current)}
        </Text>
        {!isToday && (
          <Text style={styles.subLabel}>{formatDateLong(current)}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={goNext}
        style={styles.arrowBtn}
        accessibilityLabel="Next day"
        testID="date-next-button"
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      {!isToday && (
        <TouchableOpacity
          onPress={goToday}
          style={styles.todayBtn}
          testID="date-today-button"
          activeOpacity={0.8}
        >
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  subLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  todayBtn: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: {
    ...typography.label,
    color: colors.accent,
  },
});
