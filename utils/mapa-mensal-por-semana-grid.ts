import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import { getMapaDiarioFuturoVagasLivres } from '@/utils/mapa-diario-futuro';

export type MapaMensalPorSemanaGridColumn = {
  key: string;
  weekdayLabel: string;
  dateLabel: string;
  sortKey: number;
};

export type MapaMensalPorSemanaGridCell = {
  item: MapaDiarioFuturoItem;
  available: boolean;
  weekdayLabel: string;
  dateLabel: string;
  timeLabel: string;
};

export type MapaMensalPorSemanaGridRow = {
  key: string;
  hora: number;
  minutos: number;
  timeLabel: string;
  cells: Record<string, MapaMensalPorSemanaGridCell | null>;
};

export type MapaMensalPorSemanaGridData = {
  columns: MapaMensalPorSemanaGridColumn[];
  rows: MapaMensalPorSemanaGridRow[];
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

function startOfLocalDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}`;
}

function formatWeekdayLabel(timestamp: number): string {
  return WEEKDAY_LABELS[new Date(timestamp).getDay()];
}

function formatTimeLabel(hora: number, minutos: number): string {
  return `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function buildTimeRowKey(hora: number, minutos: number): string {
  return `${hora}:${minutos}`;
}

function buildDateColumnKey(dayStart: number): string {
  return String(dayStart);
}

export function buildMapaMensalPorSemanaGrid(horarios: MapaDiarioFuturoItem[]): MapaMensalPorSemanaGridData {
  const columnMap = new Map<string, MapaMensalPorSemanaGridColumn>();
  const rowMap = new Map<string, MapaMensalPorSemanaGridRow>();

  for (const item of horarios) {
    const dayStart = startOfLocalDay(item.dataAtividade);
    const dateKey = buildDateColumnKey(dayStart);
    const timeKey = buildTimeRowKey(item.hora, item.minutos);

    if (!columnMap.has(dateKey)) {
      columnMap.set(dateKey, {
        key: dateKey,
        weekdayLabel: formatWeekdayLabel(item.dataAtividade),
        dateLabel: formatDateLabel(item.dataAtividade),
        sortKey: dayStart,
      });
    }

    let row = rowMap.get(timeKey);

    if (!row) {
      row = {
        key: timeKey,
        hora: item.hora,
        minutos: item.minutos,
        timeLabel: formatTimeLabel(item.hora, item.minutos),
        cells: {},
      };
      rowMap.set(timeKey, row);
    }

    row.cells[dateKey] = {
      item,
      available: getMapaDiarioFuturoVagasLivres(item) > 0,
      weekdayLabel: formatWeekdayLabel(item.dataAtividade),
      dateLabel: formatDateLabel(item.dataAtividade),
      timeLabel: formatTimeLabel(item.hora, item.minutos),
    };
  }

  const columns = [...columnMap.values()].sort((a, b) => a.sortKey - b.sortKey);
  const rows = [...rowMap.values()].sort((a, b) => {
    if (a.hora !== b.hora) {
      return a.hora - b.hora;
    }

    return a.minutos - b.minutos;
  });

  return { columns, rows };
}
