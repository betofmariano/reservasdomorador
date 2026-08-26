import type { Horario, HorarioDiaKey } from '@/types/horario';
import { createEmptyHorarioDiasSemana } from '@/utils/horario-cadastro-form';
import { buildHorarioTexto, compareHorarios } from '@/utils/horario-format';

export type MapaHorariosGridColumn = {
  key: HorarioDiaKey;
  label: string;
};

export type MapaHorariosGridRow = {
  hora: number;
  minutos: number;
  label: string;
  dias: Record<HorarioDiaKey, boolean>;
};

export type MapaHorariosGridData = {
  columns: MapaHorariosGridColumn[];
  rows: MapaHorariosGridRow[];
};

export const MAPA_HORARIOS_GRID_COLUMNS: MapaHorariosGridColumn[] = [
  { key: 'segunda', label: 'Seg' },
  { key: 'terca', label: 'Ter' },
  { key: 'quarta', label: 'Qua' },
  { key: 'quinta', label: 'Qui' },
  { key: 'sexta', label: 'Sex' },
  { key: 'sabado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

function buildHorarioRowKey(hora: number, minutos: number): string {
  return `${hora}:${minutos}`;
}

export function buildMapaHorariosGrid(horarios: Horario[]): MapaHorariosGridData {
  const rowMap = new Map<string, MapaHorariosGridRow>();

  for (const horario of horarios) {
    const key = buildHorarioRowKey(horario.hora, horario.minutos);
    let row = rowMap.get(key);

    if (!row) {
      row = {
        hora: horario.hora,
        minutos: horario.minutos,
        label: buildHorarioTexto(horario.hora, horario.minutos),
        dias: createEmptyHorarioDiasSemana(),
      };
      rowMap.set(key, row);
    }

    for (const column of MAPA_HORARIOS_GRID_COLUMNS) {
      if (horario[column.key]) {
        row.dias[column.key] = true;
      }
    }
  }

  const rows = Array.from(rowMap.values()).sort(compareHorarios);

  return {
    columns: MAPA_HORARIOS_GRID_COLUMNS,
    rows,
  };
}
