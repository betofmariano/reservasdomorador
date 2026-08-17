import type { ReservaPeriodoRelatorioItem } from '@/types/lista-reservas-periodo';
import {
  normalizeRecordId,
  readString,
  readTimestamp,
} from '@/utils/normalize-api-fields';

function normalizeReservaPeriodoItem(
  record: Record<string, unknown>,
): ReservaPeriodoRelatorioItem | null {
  const id = normalizeRecordId(record.id);

  if (id == null) {
    return null;
  }

  const academiasId = normalizeRecordId(record.academias_id ?? record.academiasId) ?? 0;
  const atividadesId = normalizeRecordId(record.atividades_id ?? record.atividadesId) ?? 0;
  const qtdeReservas = normalizeRecordId(record.qtdeReservas ?? record.qtde_reservas) ?? 0;
  const qtdePresente = normalizeRecordId(record.qtdePresente ?? record.qtde_presente) ?? 0;
  const qtdeAusente = Math.max(0, qtdeReservas - qtdePresente);

  return {
    id,
    academiasId,
    atividadesId,
    atividadeNome:
      readString(record, ['atividade', 'atividade_nome', 'atividadeNome']) || 'Atividade',
    qtdeReservas,
    qtdePresente,
    qtdeAusente,
    dataInicial:
      readTimestamp(record, ['dataInicial', 'data_inicial']) ??
      readTimestamp(record, ['dataHoraInicial', 'data_hora_inicial']) ??
      0,
    dataFinal:
      readTimestamp(record, ['dataFinal', 'data_final']) ??
      readTimestamp(record, ['dataHoraFinal', 'data_hora_final']) ??
      0,
  };
}

export function normalizeReservasPeriodoResponse(raw: unknown): ReservaPeriodoRelatorioItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        typeof item === 'object' && item != null
          ? normalizeReservaPeriodoItem(item as Record<string, unknown>)
          : null,
      )
      .filter((item): item is ReservaPeriodoRelatorioItem => item != null);
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const listRaw = record.reservas ?? record.items ?? record.data ?? record.results;

  if (!Array.isArray(listRaw)) {
    return [];
  }

  return normalizeReservasPeriodoResponse(listRaw);
}
