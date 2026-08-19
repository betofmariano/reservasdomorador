import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { formatTimeLabel } from '@/utils/jogos-time';
import { usePickerSheetLayout } from '@/hooks/use-picker-sheet-layout';

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
};

type HourRange = {
  start: number;
  end: number;
};

type TimePickerSheetProps = {
  visible: boolean;
  value: Date;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30 | 60;
  hourRange?: HourRange;
  includeEndOfDay?: boolean;
  onConfirm: (time: Date) => void;
  onClose: () => void;
  presentation?: 'modal' | 'overlay';
  maxWidth?: number;
};

const WEB_TIME_DAY_MINUTES = 24 * 60;

function buildWebTimeOptions(
  interval: number,
  hourRange?: HourRange,
  includeEndOfDay = false,
): Date[] {
  const options: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  const startMinutes = hourRange ? hourRange.start * 60 : 0;
  const endMinutes = hourRange ? hourRange.end * 60 : WEB_TIME_DAY_MINUTES - interval;

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += interval) {
    const slot = new Date(base);
    slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    options.push(slot);
  }

  if (includeEndOfDay) {
    const last = options[options.length - 1];
    if (!last || last.getHours() !== 23 || last.getMinutes() !== 59) {
      const endOfDay = new Date(base);
      endOfDay.setHours(23, 59, 0, 0);
      options.push(endOfDay);
    }
  }

  return options;
}

export function TimePickerSheet({
  visible,
  value,
  minuteInterval = 15,
  hourRange,
  includeEndOfDay = false,
  onConfirm,
  onClose,
  presentation = 'modal',
  maxWidth,
}: TimePickerSheetProps) {
  const [tempTime, setTempTime] = useState(value);
  const androidPickerOpenedRef = useRef(false);
  const useHourRangeList = hourRange != null;
  const { overlayStyle, cardStyle } = usePickerSheetLayout({ maxWidth });
  const webTimeOptions = useMemo(
    () => buildWebTimeOptions(minuteInterval, hourRange, includeEndOfDay),
    [hourRange, includeEndOfDay, minuteInterval],
  );

  useEffect(() => {
    if (!visible) {
      androidPickerOpenedRef.current = false;
      return;
    }

    setTempTime(value);
  }, [value, visible]);

  useEffect(() => {
    if (!visible || useHourRangeList || Platform.OS !== 'android' || androidPickerOpenedRef.current) {
      return;
    }

    androidPickerOpenedRef.current = true;

    const nativeMinuteInterval =
      minuteInterval === 60 ? undefined : (minuteInterval as Exclude<typeof minuteInterval, 60>);

    DateTimePickerAndroid.open({
      value,
      mode: 'time',
      is24Hour: true,
      ...(nativeMinuteInterval ? { minuteInterval: nativeMinuteInterval } : {}),
      onChange: (event, time) => {
        onClose();

        if (event.type !== 'set' || !time) {
          return;
        }

        onConfirm(time);
      },
    });
  }, [minuteInterval, useHourRangeList, value, visible]);

  function handleIosChange(_event: DateTimePickerEvent, nextTime?: Date) {
    if (nextTime) {
      setTempTime(nextTime);
    }
  }

  function handleIosConfirm() {
    onConfirm(tempTime);
    onClose();
  }

  function renderWebContent() {
    const baseOverlay =
      presentation === 'overlay' ? styles.overlayEmbedded : styles.overlay;

    return (
      <Pressable style={[baseOverlay, overlayStyle]} onPress={onClose}>
        <Pressable
          style={[styles.webCard, cardStyle]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Selecione o horário</Text>
          <ScrollView style={styles.webList} showsVerticalScrollIndicator={false}>
            {webTimeOptions.map((slot) => {
              const isSelected =
                slot.getHours() === value.getHours() && slot.getMinutes() === value.getMinutes();

              return (
                <Pressable
                  key={slot.getTime()}
                  style={[styles.webOption, isSelected && styles.webOptionSelected]}
                  onPress={() => {
                    onConfirm(slot);
                    onClose();
                  }}>
                  <Text style={[styles.webOptionText, isSelected && styles.webOptionTextSelected]}>
                    {formatTimeLabel(slot)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    );
  }

  function renderIosContent() {
    const baseOverlay =
      presentation === 'overlay' ? styles.overlayEmbedded : styles.overlay;

    return (
      <Pressable style={[baseOverlay, overlayStyle]} onPress={onClose}>
        <Pressable
          style={[styles.iosCard, cardStyle]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Selecione o horário</Text>
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            locale="pt-BR"
            minuteInterval={minuteInterval}
            onChange={handleIosChange}
            themeVariant="light"
            textColor={COLORS.navy}
            accentColor={COLORS.blue}
            style={styles.iosSpinnerPicker}
          />
          <Pressable style={styles.confirmButton} onPress={handleIosConfirm}>
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    );
  }

  if (!visible) {
    return null;
  }

  if (useHourRangeList) {
    const hourRangeContent = renderWebContent();

    if (presentation === 'overlay') {
      return hourRangeContent;
    }

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={onClose}
        presentationStyle="overFullScreen"
        statusBarTranslucent>
        {hourRangeContent}
      </Modal>
    );
  }

  if (Platform.OS === 'android') {
    return null;
  }

  if (Platform.OS === 'web') {
    if (presentation === 'overlay') {
      return renderWebContent();
    }

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent>
        {renderWebContent()}
      </Modal>
    );
  }

  if (presentation === 'overlay') {
    return renderIosContent();
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent>
      {renderIosContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  overlayEmbedded: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    zIndex: 30,
  },
  iosCard: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 20,
  },
  iosSpinnerPicker: {
    height: 216,
    alignSelf: 'center',
  },
  webCard: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '55%',
  },
  webList: {
    maxHeight: 320,
    paddingHorizontal: 16,
  },
  webOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    alignItems: 'center',
  },
  webOptionSelected: {
    backgroundColor: '#EAF1FB',
  },
  webOptionText: {
    fontSize: 16,
    color: COLORS.blue,
    fontWeight: '600',
  },
  webOptionTextSelected: {
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmButton: {
    marginHorizontal: 20,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
