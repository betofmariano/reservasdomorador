import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ListaReservaItem } from '@/types/lista-reserva';
import { formatFullDateLabel, formatGameTime } from '@/utils/jogos-time';
import { formatListaReservaMensalPorSemanaDataHora } from '@/utils/lista-reservas';
import type { ListaReservasTableLayout } from '@/utils/lista-reservas-table-layout';

type ListaReservaListItemProps = {
  reserva: ListaReservaItem;
  layout: ListaReservasTableLayout;
  showDeleteAction?: boolean;
  canDelete?: boolean;
  showResponsavel?: boolean;
  showUnidade?: boolean;
  onDeletePress?: () => void;
};

export { LISTA_RESERVA_TABLE_MIN_WIDTH } from '@/utils/lista-reservas-table-layout';

const COL_DATA_WIDTH = 72;
const COL_DATA_HORA_WIDTH = 122;
const COL_HORA_WIDTH = 72;
const COL_ATIVIDADE_WIDTH = 180;
const COL_USUARIO_WIDTH = 200;
const COL_RESPONSAVEL_WIDTH = 180;
const COL_DATA_FONT_SIZE = 14;
const COL_NOME_FONT_SIZE = 16;

const COLORS = {
  navy: '#3A2154',
  error: '#D64545',
  border: '#E2E6EE',
};

function getTableRowStyle(layout: ListaReservasTableLayout): ViewStyle {
  if (layout.isCompact) {
    return { minWidth: layout.tableWidth };
  }

  return { width: '100%' };
}

function getColAtividadeTextStyle(layout: ListaReservasTableLayout): TextStyle {
  if (layout.isCompact) {
    return styles.colAtividadeCompact;
  }

  return styles.colAtividadeFluid;
}

function getColUsuarioTextStyle(layout: ListaReservasTableLayout): TextStyle {
  if (layout.isCompact) {
    return styles.colUsuarioCompact;
  }

  return styles.colUsuarioFluid;
}

function getColNomeMensalPorSemanaTextStyle(layout: ListaReservasTableLayout): TextStyle {
  if (layout.isCompact) {
    return styles.colNomeMensalCompactText;
  }

  return styles.colNomeMensalFluidText;
}

function getColDataStyle(): TextStyle {
  return styles.colDataText;
}

export function ListaReservaListHeader({
  layout,
  showDeleteAction = false,
  showResponsavel = true,
  showUnidade = false,
}: {
  layout: ListaReservasTableLayout;
  showDeleteAction?: boolean;
  showResponsavel?: boolean;
  showUnidade?: boolean;
}) {
  const rowStyle = getTableRowStyle(layout);

  if (layout.variant === 'mensalPorSemana') {
    return (
      <View style={[styles.tableRow, styles.headerRow, rowStyle]}>
        {showDeleteAction ? <View style={styles.deleteCol} /> : null}
        <Text style={[styles.headerCell, styles.colDataHoraHeader]}>Data</Text>
        <Text style={[styles.headerCell, getColNomeMensalPorSemanaTextStyle(layout)]}>Morador</Text>
        {showUnidade ? (
          <Text style={[styles.headerCell, styles.colUnidadeMensal]}>Unidade</Text>
        ) : null}
        {showResponsavel ? (
          <Text style={[styles.headerCell, styles.colResponsavelMensal]}>Responsável</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.tableRow, styles.headerRow, rowStyle]}>
      {showDeleteAction ? <View style={styles.deleteCol} /> : null}
      <Text style={[styles.headerCell, styles.colDataHeader]}>Data</Text>
      <Text style={[styles.headerCell, styles.colHora]}>Horário</Text>
      <Text style={[styles.headerCell, getColAtividadeTextStyle(layout)]}>Atividade</Text>
      <Text style={[styles.headerCell, getColUsuarioTextStyle(layout)]}>Morador</Text>
      {showResponsavel ? (
        <Text style={[styles.headerCell, styles.colResponsavel]}>Responsável</Text>
      ) : null}
    </View>
  );
}

export function ListaReservaListItem({
  reserva,
  layout,
  showDeleteAction = false,
  canDelete = true,
  showResponsavel = true,
  showUnidade = false,
  onDeletePress,
}: ListaReservaListItemProps) {
  const usuarioNome = reserva.usuarioNome || 'Não informado';
  const responsavelNome = reserva.responsavelNome?.trim() || '—';
  const unidadeNome = reserva.unidadeNome?.trim() || '—';
  const rowStyle = getTableRowStyle(layout);

  if (layout.variant === 'mensalPorSemana') {
    return (
      <View style={[styles.tableRow, rowStyle]}>
        {showDeleteAction ? (
          <View style={styles.deleteCol}>
            {canDelete ? (
              <Pressable
                onPress={onDeletePress}
                accessibilityLabel="Excluir reserva">
                <Ionicons name="trash-outline" size={26} color={COLORS.error} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.tableCell, styles.colDataHoraText]} numberOfLines={1}>
          {reserva.dataAtividade > 0
            ? formatListaReservaMensalPorSemanaDataHora(reserva.dataAtividade)
            : '—'}
        </Text>

        <Text style={[styles.tableCell, getColNomeMensalPorSemanaTextStyle(layout)]} numberOfLines={3}>
          {usuarioNome}
        </Text>

        {showUnidade ? (
          <Text style={[styles.tableCell, styles.colUnidadeMensal]} numberOfLines={1}>
            {unidadeNome}
          </Text>
        ) : null}

        {showResponsavel ? (
          <Text style={[styles.tableCell, styles.colResponsavelMensal]} numberOfLines={2}>
            {responsavelNome}
          </Text>
        ) : null}
      </View>
    );
  }

  const dataLabel = formatFullDateLabel(new Date(reserva.dataAtividade));
  const horaLabel = formatGameTime(reserva.dataAtividade);

  return (
    <View style={[styles.tableRow, rowStyle]}>
      {showDeleteAction ? (
        <View style={styles.deleteCol}>
          {canDelete ? (
            <Pressable
              onPress={onDeletePress}
              accessibilityLabel="Excluir reserva">
              <Ionicons name="trash-outline" size={26} color={COLORS.error} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.tableCell, getColDataStyle()]} numberOfLines={1}>
        {dataLabel}
      </Text>
      <Text style={[styles.tableCell, styles.colHora]} numberOfLines={1}>
        {horaLabel}
      </Text>
      <Text style={[styles.tableCell, getColAtividadeTextStyle(layout)]} numberOfLines={2}>
        {reserva.atividade}
      </Text>

      <Text style={[styles.tableCell, getColUsuarioTextStyle(layout), styles.usuarioNomeText]} numberOfLines={2}>
        {usuarioNome}
      </Text>

      {showResponsavel ? (
        <Text style={[styles.tableCell, styles.colResponsavel]} numberOfLines={2}>
          {responsavelNome}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    backgroundColor: '#DDE3EE',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    zIndex: 1,
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  tableCell: {
    fontSize: 13,
    color: COLORS.navy,
  },
  deleteCol: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  colDataText: {
    width: COL_DATA_WIDTH,
    flexShrink: 0,
    fontSize: COL_DATA_FONT_SIZE,
    textAlign: 'center',
  },
  colDataHeader: {
    width: COL_DATA_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
    fontSize: COL_DATA_FONT_SIZE,
  },
  colDataHoraHeader: {
    width: COL_DATA_HORA_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
    fontSize: COL_DATA_FONT_SIZE,
  },
  colDataHoraText: {
    width: COL_DATA_HORA_WIDTH,
    flexShrink: 0,
    fontSize: COL_DATA_FONT_SIZE,
    fontWeight: '700',
    textAlign: 'center',
  },
  colHora: {
    width: COL_HORA_WIDTH,
    flexShrink: 0,
  },
  colAtividadeCompact: {
    width: COL_ATIVIDADE_WIDTH,
    flexShrink: 0,
  },
  colAtividadeFluid: {
    flex: 1,
    minWidth: 72,
  },
  colUsuarioCompact: {
    width: COL_USUARIO_WIDTH,
    flex: 1,
    minWidth: COL_USUARIO_WIDTH,
    fontSize: COL_NOME_FONT_SIZE,
  },
  colUsuarioFluid: {
    flex: 1.2,
    minWidth: 120,
    fontSize: COL_NOME_FONT_SIZE,
  },
  colResponsavel: {
    width: COL_RESPONSAVEL_WIDTH,
    flexShrink: 0,
  },
  colResponsavelMensal: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: COL_DATA_FONT_SIZE,
  },
  colUnidadeMensal: {
    width: 72,
    flexShrink: 0,
    fontSize: COL_DATA_FONT_SIZE,
  },
  colNomeMensalCompactText: {
    flex: 1.4,
    minWidth: 0,
    flexShrink: 1,
    fontSize: COL_NOME_FONT_SIZE,
  },
  colNomeMensalFluidText: {
    flex: 1.4,
    minWidth: 0,
    flexShrink: 1,
    fontSize: COL_NOME_FONT_SIZE,
  },
  usuarioNomeText: {
    minWidth: 0,
    fontSize: COL_NOME_FONT_SIZE,
  },
});
