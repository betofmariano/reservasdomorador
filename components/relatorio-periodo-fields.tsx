import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateLabel, formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';

type RelatorioPeriodoFieldsProps = {
  startDate: Date;
  endDate: Date;
  onPressStartDate: () => void;
  onPressEndDate: () => void;
  startTime?: Date;
  endTime?: Date;
  onPressStartTime?: () => void;
  onPressEndTime?: () => void;
  showTimeFields?: boolean;
  /** Exibe dd/mm sem o ano. */
  hideYear?: boolean;
  /** "De [data] a [data]" centralizado, com fonte maior. */
  layout?: 'default' | 'de-a';
};

const COLORS = {
  navy: '#3A2154',
  border: '#D5DAE3',
  muted: '#5C6475',
};

export function RelatorioPeriodoFields({
  startDate,
  endDate,
  onPressStartDate,
  onPressEndDate,
  startTime,
  endTime,
  onPressStartTime,
  onPressEndTime,
  showTimeFields = false,
  hideYear = false,
  layout = 'default',
}: RelatorioPeriodoFieldsProps) {
  const formatDate = hideYear ? formatDateLabel : formatFullDateLabel;

  if (layout === 'de-a') {
    return (
      <View style={styles.deARow}>
        <Text style={styles.deALabel}>De</Text>
        <Pressable style={styles.deAButton} onPress={onPressStartDate}>
          <Text style={styles.deAValue}>{formatDate(startDate)}</Text>
        </Pressable>
        <Text style={styles.deALabel}>a</Text>
        <Pressable style={styles.deAButton} onPress={onPressEndDate}>
          <Text style={styles.deAValue}>{formatDate(endDate)}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.periodRow}>
        <Pressable style={styles.periodButton} onPress={onPressStartDate}>
          <Text style={styles.periodHint}>Data inicial</Text>
          <Text style={styles.periodValue}>{formatDate(startDate)}</Text>
        </Pressable>
        <Pressable style={styles.periodButton} onPress={onPressEndDate}>
          <Text style={styles.periodHint}>Data final</Text>
          <Text style={styles.periodValue}>{formatDate(endDate)}</Text>
        </Pressable>
      </View>

      {showTimeFields && startTime && endTime && onPressStartTime && onPressEndTime ? (
        <View style={styles.periodRow}>
          <Pressable style={styles.periodButton} onPress={onPressStartTime}>
            <Text style={styles.periodHint}>Hora inicial</Text>
            <Text style={styles.periodValue}>{formatGameTime(startTime.getTime())}</Text>
          </Pressable>
          <Pressable style={styles.periodButton} onPress={onPressEndTime}>
            <Text style={styles.periodHint}>Hora final</Text>
            <Text style={styles.periodValue}>{formatGameTime(endTime.getTime())}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  periodHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  deARow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  deALabel: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.navy,
  },
  deAButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minWidth: 88,
    alignItems: 'center',
  },
  deAValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
  },
});
