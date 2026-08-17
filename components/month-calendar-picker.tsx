import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  addMonthsToView,
  buildMonthCalendarGrid,
  getInitialVisibleMonth,
  getMonthName,
  isDateWithinRange,
  isToday,
  WEEKDAY_LABELS,
} from '@/utils/month-calendar';
import { isSameCalendarDay, normalizeCalendarDate } from '@/utils/jogos-time';

const COLORS = {
  text: '#111111',
  muted: '#8A8F99',
  faint: '#C5C9D1',
  blue: '#007AFF',
  red: '#E53935',
  white: '#FFFFFF',
};

type MonthCalendarPickerProps = {
  value: Date | null;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (date: Date) => void;
  onClear?: () => void;
  onClose?: () => void;
};

function TodayMarker() {
  return <View style={styles.todayMarker} />;
}

function FooterIcon({ variant }: { variant: 'today' | 'clear' | 'close' }) {
  if (variant === 'today') {
    return (
      <View style={styles.footerIconWrap}>
        <View style={styles.footerTodayIcon} />
      </View>
    );
  }

  if (variant === 'clear') {
    return (
      <View style={styles.footerIconWrap}>
        <View style={styles.footerClearIcon} />
      </View>
    );
  }

  return (
    <View style={styles.footerIconWrap}>
      <Text style={styles.footerCloseIcon}>×</Text>
    </View>
  );
}

export function MonthCalendarPicker({
  value,
  minimumDate,
  maximumDate,
  onChange,
  onClear,
  onClose,
}: MonthCalendarPickerProps) {
  const initialView = useMemo(
    () =>
      getInitialVisibleMonth(
        value ?? minimumDate ?? maximumDate ?? new Date(),
        minimumDate,
        maximumDate,
      ),
    [maximumDate, minimumDate, value],
  );
  const [visibleYear, setVisibleYear] = useState(initialView.year);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(initialView.monthIndex);

  useEffect(() => {
    setVisibleYear(initialView.year);
    setVisibleMonthIndex(initialView.monthIndex);
  }, [initialView.monthIndex, initialView.year]);

  const cells = useMemo(
    () => buildMonthCalendarGrid(visibleYear, visibleMonthIndex),
    [visibleMonthIndex, visibleYear],
  );
  const today = useMemo(() => normalizeCalendarDate(new Date()), []);

  function handlePreviousMonth() {
    const next = addMonthsToView(visibleYear, visibleMonthIndex, -1);
    setVisibleYear(next.year);
    setVisibleMonthIndex(next.monthIndex);
  }

  function handleNextMonth() {
    const next = addMonthsToView(visibleYear, visibleMonthIndex, 1);
    setVisibleYear(next.year);
    setVisibleMonthIndex(next.monthIndex);
  }

  function handleSelectDate(date: Date) {
    if (!isDateWithinRange(date, minimumDate, maximumDate)) {
      return;
    }

    onChange(normalizeCalendarDate(date));
  }

  function handleTodayPress() {
    if (!isDateWithinRange(today, minimumDate, maximumDate)) {
      return;
    }

    setVisibleYear(today.getFullYear());
    setVisibleMonthIndex(today.getMonth());
    onChange(today);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.navButton}
          onPress={handlePreviousMonth}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior">
          <Text style={styles.navArrow}>◀</Text>
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.monthLabel}>{getMonthName(visibleMonthIndex)}</Text>
          <Text style={styles.yearLabel}>{visibleYear}</Text>
        </View>

        <Pressable
          style={styles.navButton}
          onPress={handleNextMonth}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês">
          <Text style={styles.navArrow}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          const isSelected = value != null && isSameCalendarDay(cell.date, value);
          const isSelectable = isDateWithinRange(cell.date, minimumDate, maximumDate);
          const showTodayMarker = isToday(cell.date, today) && !isSelected;
          const inCurrentMonth = cell.inCurrentMonth;

          return (
            <Pressable
              key={cell.date.getTime()}
              style={styles.dayCell}
              disabled={!isSelectable}
              onPress={() => handleSelectDate(cell.date)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: !isSelectable }}>
              <View
                style={[
                  styles.dayInner,
                  isSelected && styles.dayInnerSelected,
                  !isSelectable && styles.dayInnerDisabled,
                ]}>
                {showTodayMarker ? <TodayMarker /> : null}
                <Text
                  style={[
                    styles.dayText,
                    !inCurrentMonth && styles.dayTextOutsideMonth,
                    isSelected && styles.dayTextSelected,
                    !isSelectable && styles.dayTextDisabled,
                  ]}>
                  {cell.date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.footerAction} onPress={handleTodayPress}>
          <FooterIcon variant="today" />
          <Text style={styles.footerActionText}>hoje</Text>
        </Pressable>

        <Pressable style={styles.footerAction} onPress={onClear}>
          <FooterIcon variant="clear" />
          <Text style={styles.footerActionText}>limpar</Text>
        </Pressable>

        <Pressable style={styles.footerAction} onPress={onClose}>
          <FooterIcon variant="close" />
          <Text style={styles.footerActionText}>fechar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CALENDAR_WIDTH = 322;
const DAY_CELL_SIZE = CALENDAR_WIDTH / 7;

const styles = StyleSheet.create({
  container: {
    width: CALENDAR_WIDTH,
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  navButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 14,
    color: COLORS.text,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  monthLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'lowercase',
  },
  yearLabel: {
    fontSize: 18,
    fontStyle: 'italic',
    color: COLORS.muted,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayLabel: {
    width: DAY_CELL_SIZE,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    textTransform: 'lowercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: DAY_CELL_SIZE - 6,
    height: DAY_CELL_SIZE - 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayInnerSelected: {
    backgroundColor: COLORS.blue,
  },
  dayInnerDisabled: {
    opacity: 0.45,
  },
  dayText: {
    fontSize: 16,
    color: COLORS.text,
  },
  dayTextOutsideMonth: {
    color: COLORS.faint,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: COLORS.faint,
  },
  todayMarker: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderLeftWidth: 7,
    borderTopColor: COLORS.blue,
    borderLeftColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  footerActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'lowercase',
  },
  footerIconWrap: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTodayIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderLeftWidth: 8,
    borderTopColor: COLORS.blue,
    borderLeftColor: 'transparent',
  },
  footerClearIcon: {
    width: 10,
    height: 2,
    backgroundColor: COLORS.red,
  },
  footerCloseIcon: {
    fontSize: 18,
    lineHeight: 14,
    color: COLORS.muted,
    fontWeight: '700',
  },
});
