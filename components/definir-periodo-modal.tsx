import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { TimePickerSheet } from '@/components/time-picker-sheet';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { formatDateLabel, formatTimeLabel, getTodayDate } from '@/utils/jogos-time';
import { getPublicidadeMinSelectableDate } from '@/utils/resumo-publicidade';

type PickerTarget = 'inicioDate' | 'inicioTime' | 'fimDate' | 'fimTime' | null;

type DefinirPeriodoModalProps = {
  visible: boolean;
  inicio: Date;
  fim: Date;
  onClose: () => void;
  onConfirm: (inicio: Date, fim: Date) => void;
};

export function DefinirPeriodoModal({
  visible,
  inicio,
  fim,
  onClose,
  onConfirm,
}: DefinirPeriodoModalProps) {
  const [inicioDate, setInicioDate] = useState(inicio);
  const [inicioTime, setInicioTime] = useState(inicio);
  const [fimDate, setFimDate] = useState(fim);
  const [fimTime, setFimTime] = useState(fim);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const minDate = getPublicidadeMinSelectableDate();
  const maxDate = getTodayDate();

  useEffect(() => {
    if (!visible) {
      return;
    }

    setInicioDate(inicio);
    setInicioTime(inicio);
    setFimDate(fim);
    setFimTime(fim);
    setPicker(null);
    setLocalError(null);
  }, [visible, inicio, fim]);

  function handleConfirm() {
    const inicioMs = new Date(
      inicioDate.getFullYear(),
      inicioDate.getMonth(),
      inicioDate.getDate(),
      inicioTime.getHours(),
      inicioTime.getMinutes(),
      0,
      0,
    ).getTime();
    const fimMs = new Date(
      fimDate.getFullYear(),
      fimDate.getMonth(),
      fimDate.getDate(),
      fimTime.getHours(),
      fimTime.getMinutes(),
      0,
      0,
    ).getTime();

    if (inicioMs > fimMs) {
      setLocalError('O início do período não pode ser depois do fim.');
      return;
    }

    onConfirm(new Date(inicioMs), new Date(fimMs));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Definir Período</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.grid}>
              <PeriodField
                label="Data inicial"
                value={formatDateLabel(inicioDate)}
                onPress={() => setPicker('inicioDate')}
              />
              <PeriodField
                label="Hora inicial"
                value={formatTimeLabel(inicioTime)}
                onPress={() => setPicker('inicioTime')}
              />
              <PeriodField
                label="Data final"
                value={formatDateLabel(fimDate)}
                onPress={() => setPicker('fimDate')}
              />
              <PeriodField
                label="Hora final"
                value={formatTimeLabel(fimTime)}
                onPress={() => setPicker('fimTime')}
              />
            </View>

            {localError ? <Text style={styles.error}>{localError}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirmar período">
              <Text style={styles.confirmText}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <DatePickerSheet
        visible={picker === 'inicioDate'}
        value={inicioDate}
        minimumDate={minDate}
        maximumDate={maxDate}
        onConfirm={setInicioDate}
        onClose={() => setPicker(null)}
      />
      <TimePickerSheet
        visible={picker === 'inicioTime'}
        value={inicioTime}
        includeEndOfDay
        onConfirm={setInicioTime}
        onClose={() => setPicker(null)}
      />
      <DatePickerSheet
        visible={picker === 'fimDate'}
        value={fimDate}
        minimumDate={minDate}
        maximumDate={maxDate}
        onConfirm={setFimDate}
        onClose={() => setPicker(null)}
      />
      <TimePickerSheet
        visible={picker === 'fimTime'}
        value={fimTime}
        includeEndOfDay
        onConfirm={setFimTime}
        onClose={() => setPicker(null)}
      />
    </Modal>
  );
}

function PeriodField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={styles.fieldText}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: MATCHPOINT_COLORS.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: MATCHPOINT_COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
  },
  header: {
    backgroundColor: MATCHPOINT_COLORS.gold,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerText: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    width: '47%',
    flexGrow: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: MATCHPOINT_COLORS.borderLight,
    borderRadius: 10,
    backgroundColor: MATCHPOINT_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  fieldText: {
    color: MATCHPOINT_COLORS.navy,
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    color: MATCHPOINT_COLORS.error,
    fontSize: 13,
    textAlign: 'center',
  },
  confirmButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: MATCHPOINT_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: MATCHPOINT_COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
});
