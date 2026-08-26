import { StyleSheet, Text, View } from 'react-native';

import { MapaFrequenciaCelula } from '@/components/mapa-frequencia/mapa-frequencia-celula';
import {
  MAPA_FREQUENCIA_COL_LATERAL_SPACING,
  MAPA_FREQUENCIA_NAME_COL_WIDTH,
  MAPA_FREQUENCIA_REPORT_WIDTH,
  MAPA_FREQUENCIA_ROW_END_PADDING,
  MAPA_FREQUENCIA_STATUS_COL_WIDTH,
} from '@/constants/web-layout';
import type { AlunoMapaFrequencia, ColunaMapaFrequencia } from '@/types/mapa-frequencia';

type MapaFrequenciaGridProps = {
  colunas: ColunaMapaFrequencia[];
  alunos: AlunoMapaFrequencia[];
};

const COLORS = {
  navy: '#3A2154',
  border: '#F9B233',
  headerBg: '#F4F6FA',
};

export function MapaFrequenciaGrid({ colunas, alunos }: MapaFrequenciaGridProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={[styles.nameHeaderCell, styles.stickyName]}>
          <Text style={styles.headerText}>Nome</Text>
        </View>
        {colunas.map((coluna) => (
          <View key={coluna.chave} style={styles.dateHeaderCell}>
            <MapaFrequenciaCelula
              variant="data"
              dataFormatada={coluna.dataFormatada}
              horaFormatada={coluna.horaFormatada}
            />
          </View>
        ))}
      </View>

      {alunos.map((aluno) => (
        <View key={aluno.id} style={styles.dataRow}>
          <View style={[styles.nameCell, styles.stickyName]}>
            <Text style={styles.nameText}>{aluno.nome}</Text>
          </View>
          {colunas.map((coluna) => (
            <View key={`${aluno.id}-${coluna.chave}`} style={styles.statusCell}>
              <MapaFrequenciaCelula status={aluno.statuses[coluna.chave]} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const NAME_COL_WIDTH = MAPA_FREQUENCIA_NAME_COL_WIDTH;
const STATUS_COL_WIDTH = MAPA_FREQUENCIA_STATUS_COL_WIDTH;

const styles = StyleSheet.create({
  wrapper: {
    width: MAPA_FREQUENCIA_REPORT_WIDTH,
    minWidth: MAPA_FREQUENCIA_REPORT_WIDTH,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.headerBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingRight: MAPA_FREQUENCIA_ROW_END_PADDING,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    paddingRight: MAPA_FREQUENCIA_ROW_END_PADDING,
  },
  stickyName: {
    width: NAME_COL_WIDTH,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  nameHeaderCell: {
    width: NAME_COL_WIDTH,
    paddingLeft: 10,
    paddingRight: MAPA_FREQUENCIA_COL_LATERAL_SPACING,
    paddingVertical: 10,
    justifyContent: 'center',
    backgroundColor: COLORS.headerBg,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  dateHeaderCell: {
    width: STATUS_COL_WIDTH,
    paddingLeft: MAPA_FREQUENCIA_COL_LATERAL_SPACING,
    paddingRight: MAPA_FREQUENCIA_COL_LATERAL_SPACING,
    paddingVertical: 8,
    alignItems: 'stretch',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameCell: {
    width: NAME_COL_WIDTH,
    paddingLeft: 10,
    paddingRight: MAPA_FREQUENCIA_COL_LATERAL_SPACING,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  statusCell: {
    width: STATUS_COL_WIDTH,
    paddingLeft: MAPA_FREQUENCIA_COL_LATERAL_SPACING,
    paddingRight: MAPA_FREQUENCIA_COL_LATERAL_SPACING,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingVertical: 8,
  },
});
