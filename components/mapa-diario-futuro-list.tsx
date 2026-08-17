import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthButton } from '@/components/auth-button';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import { navigateToHome } from '@/utils/auth-navigation';
import {
  formatMapaDiarioFuturoDataLabel,
  getMapaDiarioFuturoVagasLivres,
} from '@/utils/mapa-diario-futuro';

type MapaDiarioFuturoListProps = {
  atividadeNome: string;
  horarios: MapaDiarioFuturoItem[];
  instructionText?: string;
  isBusy?: boolean;
  /** Quando true, permite tocar em horários lotados (lista de espera). */
  allowSelectWhenFull?: boolean;
  onSelectHorario: (item: MapaDiarioFuturoItem) => void;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  blue: MATCHPOINT_COLORS.blue,
  white: MATCHPOINT_COLORS.white,
  muted: MATCHPOINT_COLORS.muted,
  border: MATCHPOINT_COLORS.borderLight,
  rowAvailable: '#E6F4EA',
  rowUnavailable: '#FCE8E8',
};

export function MapaDiarioFuturoList({
  atividadeNome,
  horarios,
  instructionText = 'Clique na data para reservar',
  isBusy = false,
  allowSelectWhenFull = false,
  onSelectHorario,
}: MapaDiarioFuturoListProps) {
  const router = useRouter();

  function handleVoltar() {
    navigateToHome(router);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{instructionText}</Text>

      <View style={styles.activityBadge}>
        <Text style={styles.activityBadgeText}>{atividadeNome}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.dataColumn]}>Data</Text>
        <Text style={[styles.headerCell, styles.metricColumn]}>Capac</Text>
        <Text style={[styles.headerCell, styles.metricColumn]}>Ocup</Text>
        <Text style={[styles.headerCell, styles.metricColumn]}>Livre</Text>
      </View>

      {horarios.map((item) => {
        const livre = getMapaDiarioFuturoVagasLivres(item);

        const isIndisponivel = livre === 0;
        const isDisabled = isBusy || (!allowSelectWhenFull && isIndisponivel);

        return (
          <Pressable
            key={item.id}
            style={[
              styles.row,
              isIndisponivel ? styles.rowUnavailable : styles.rowAvailable,
            ]}
            disabled={isDisabled}
            onPress={() => onSelectHorario(item)}>
            <Text style={[styles.rowCell, styles.dataColumn]}>
              {formatMapaDiarioFuturoDataLabel(item.dataAtividade)}
            </Text>
            <Text style={[styles.rowCell, styles.metricColumn]}>{item.capacidade}</Text>
            <Text style={[styles.rowCell, styles.metricColumn]}>{item.ocupacao}</Text>
            <Text style={[styles.rowCell, styles.metricColumn]}>{livre}</Text>
          </Pressable>
        );
      })}

      <AuthButton
        label="Voltar"
        variant="voltar"
        onPress={handleVoltar}
        disabled={isBusy}
        style={styles.voltarButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 16,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 16,
  },
  activityBadge: {
    alignSelf: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
  },
  activityBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rowAvailable: {
    backgroundColor: COLORS.rowAvailable,
  },
  rowUnavailable: {
    backgroundColor: COLORS.rowUnavailable,
  },
  rowCell: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  dataColumn: {
    flex: 1.4,
  },
  metricColumn: {
    flex: 0.7,
  },
  voltarButton: {
    marginTop: 24,
    alignSelf: 'center',
    maxWidth: 280,
  },
});
