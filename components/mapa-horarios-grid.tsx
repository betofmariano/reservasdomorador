import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AdminTableScrollContainer } from '@/components/admin-table-scroll-container';
import { LogadoBooleanCell } from '@/components/logado-boolean-cell';
import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import type { MapaHorariosGridData } from '@/utils/mapa-horarios-grid';

type MapaHorariosGridProps = {
  grid: MapaHorariosGridData;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  border: MATCHPOINT_COLORS.border,
  white: MATCHPOINT_COLORS.white,
};

const TIME_COLUMN_WIDTH = 52;
const TABLE_MIN_WIDTH = TIME_COLUMN_WIDTH + 36 * 7;
const MAPA_HORARIOS_ICON_SIZE = 27;

export function MapaHorariosGrid({ grid }: MapaHorariosGridProps) {
  return (
    <AdminTableScrollContainer
      minWidth={TABLE_MIN_WIDTH}
      centerWhenScreenWiderThan={WEB_MAX_CONTENT_WIDTH}>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <View style={[styles.headerCell, styles.timeHeaderCell]}>
            <Text style={styles.headerText} numberOfLines={1}>
              Horário
            </Text>
          </View>
          {grid.columns.map((column) => (
            <View key={column.key} style={[styles.headerCell, styles.dayHeaderCell]}>
              <Text style={styles.headerText} numberOfLines={1}>
                {column.label}
              </Text>
            </View>
          ))}
        </View>

        {grid.rows.map((row) => (
          <View key={`${row.hora}:${row.minutos}`} style={styles.dataRow}>
            <View style={[styles.dataCell, styles.timeDataCell]}>
              <Text style={styles.timeText}>{row.label}</Text>
            </View>
            {grid.columns.map((column) => (
              <View key={column.key} style={[styles.dataCell, styles.dayDataCell]}>
                {row.dias[column.key] ? (
                  <LogadoBooleanCell value iconSize={MAPA_HORARIOS_ICON_SIZE} />
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    </AdminTableScrollContainer>
  );
}

export function MapaHorariosGridLoading() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={MATCHPOINT_COLORS.blue} />
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  dataCell: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  timeHeaderCell: {
    width: TIME_COLUMN_WIDTH,
    flexShrink: 0,
  },
  dayHeaderCell: {
    flex: 1,
    minWidth: 0,
  },
  timeDataCell: {
    width: TIME_COLUMN_WIDTH,
    flexShrink: 0,
  },
  dayDataCell: {
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 160,
  },
});
