import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { MonthCalendarPicker } from '@/components/month-calendar-picker';
import { usePickerSheetLayout } from '@/hooks/use-picker-sheet-layout';
import { getTodayDate, normalizeCalendarDate } from '@/utils/jogos-time';

const DEFAULT_RANGE_DAYS = 90;

type DatePickerSheetProps = {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  presentation?: 'modal' | 'overlay';
  maxWidth?: number;
};

export function DatePickerSheet({
  visible,
  value,
  minimumDate,
  maximumDate,
  onConfirm,
  onClose,
  presentation = 'modal',
  maxWidth,
}: DatePickerSheetProps) {
  const [tempDate, setTempDate] = useState<Date | null>(value);
  const { overlayStyle, isLargeScreen } = usePickerSheetLayout({ maxWidth });
  const resolvedMinimumDate = useMemo(
    () => normalizeCalendarDate(minimumDate ?? getTodayDate()),
    [minimumDate],
  );
  const resolvedMaximumDate = useMemo(() => {
    if (maximumDate) {
      return normalizeCalendarDate(maximumDate);
    }

    // Se o mínimo está no passado, a janela futura parte de hoje (não do mínimo).
    const today = getTodayDate();
    const rangeStart =
      resolvedMinimumDate.getTime() > today.getTime() ? resolvedMinimumDate : today;
    const fallback = new Date(rangeStart);
    fallback.setDate(fallback.getDate() + DEFAULT_RANGE_DAYS - 1);
    return normalizeCalendarDate(fallback);
  }, [maximumDate, resolvedMinimumDate]);

  const androidPickerOpenedRef = useRef(false);
  const useDesktopCalendar = Platform.OS === 'web' || Platform.OS === 'ios';

  useEffect(() => {
    if (!visible) {
      androidPickerOpenedRef.current = false;
      return;
    }

    setTempDate(value);
  }, [value, visible]);

  useEffect(() => {
    if (
      !visible ||
      useDesktopCalendar ||
      Platform.OS !== 'android' ||
      androidPickerOpenedRef.current
    ) {
      return;
    }

    androidPickerOpenedRef.current = true;

    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      display: 'calendar',
      minimumDate: resolvedMinimumDate,
      maximumDate: resolvedMaximumDate,
      onChange: (event, date) => {
        onClose();

        if (event.type !== 'set' || !date) {
          return;
        }

        onConfirm(normalizeCalendarDate(date));
      },
    });
  }, [
    onClose,
    onConfirm,
    resolvedMaximumDate,
    resolvedMinimumDate,
    useDesktopCalendar,
    value,
    visible,
  ]);

  function handleCalendarChange(date: Date) {
    const normalized = normalizeCalendarDate(date);
    setTempDate(normalized);
    onConfirm(normalized);
    onClose();
  }

  function handleCalendarClear() {
    setTempDate(value);
  }

  function renderDesktopCalendarContent() {
    const baseOverlay =
      presentation === 'overlay' ? styles.overlayEmbedded : styles.overlayDesktop;

    return (
      <Pressable style={[baseOverlay, overlayStyle]} onPress={onClose}>
        <Pressable
          style={[styles.desktopCard, isLargeScreen && styles.desktopCardLarge]}
          onPress={(event) => event.stopPropagation()}>
          <MonthCalendarPicker
            value={tempDate}
            minimumDate={resolvedMinimumDate}
            maximumDate={resolvedMaximumDate}
            onChange={handleCalendarChange}
            onClear={handleCalendarClear}
            onClose={onClose}
          />
        </Pressable>
      </Pressable>
    );
  }

  if (!visible) {
    return null;
  }

  if (Platform.OS === 'android') {
    return null;
  }

  const sheetContent = renderDesktopCalendarContent();

  if (presentation === 'overlay') {
    return sheetContent;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent>
      {sheetContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayDesktop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  overlayEmbedded: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  desktopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' as const }
      : {
          shadowColor: '#000000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }),
  },
  desktopCardLarge: {
    borderRadius: 4,
  },
});
