import type { ReservaAtividadeRelatorioItem } from '@/types/lista-reservas-atividade';
import type { ReservaUsuario } from '@/types/reserva-usuario';
import {
  dedupeReservasAtividadeRelatorio,
  mapReservaPresencaToRelatorioItem,
  resolvePresencaRelatorioStatus,
} from '@/utils/lista-reservas-atividade';
import { normalizeReservaPresenca } from '@/utils/normalize-presenca';
import {
  normalizeBoolean,
  normalizeRecordId,
  readString,
  readTimestamp,
} from '@/utils/normalize-api-fields';

function normalizeRelatorioItemFromRecord(
  record: Record<string, unknown>,
  atividadeNomeFallback = '',
): ReservaAtividadeRelatorioItem | null {
  const reservaId = normalizeRecordId(record.reserva_id ?? record.reservaId ?? record.id);

  if (reservaId == null) {
    return null;
  }

  const usersId = normalizeRecordId(record.users_id ?? record.usersId ?? record.usuario_id) ?? 0;
  const dataHora =
    readTimestamp(record, ['dataHora', 'data_hora', 'dataAtividade', 'data_atividade']) ?? 0;
  const atividadeId =
    normalizeRecordId(record.atividade_id ?? record.atividades_id ?? record.atividadeId) ?? 0;
  const presente = normalizeBoolean(record.presente);
  const presencaStatusRaw = readString(record, ['presencaStatus', 'presenca_status']).trim();

  let presencaStatus = resolvePresencaRelatorioStatus(
    presente,
    readString(record, ['presencaRegistradaEm', 'presenca_registrada_em']) || null,
    normalizeRecordId(record.presencaRegistradaPor ?? record.presenca_registrada_por),
  );

  if (presencaStatusRaw === 'presente' || presencaStatusRaw === 'ausente' || presencaStatusRaw === 'nao_registrado') {
    presencaStatus = presencaStatusRaw === 'nao_registrado' ? 'ausente' : presencaStatusRaw;
  }

  return {
    reservaId,
    usersId,
    nome:
      readString(record, ['nome', 'nome_usuario', 'nomeUsuario']) ||
      readString(record, ['usuario_nome']) ||
      'Participante',
    atividadeId,
    atividadeNome:
      readString(record, ['atividade_nome', 'atividadeNome', 'atividade']) || atividadeNomeFallback,
    dataHora,
    presencaStatus,
  };
}

export function normalizeReservasAtividadePeriodoResponse(
  raw: unknown,
  atividadeNomeFallback = '',
): ReservaAtividadeRelatorioItem[] {
  if (Array.isArray(raw)) {
    return dedupeReservasAtividadeRelatorio(
      raw
        .map((item) =>
          typeof item === 'object' && item != null
            ? normalizeRelatorioItemFromRecord(item as Record<string, unknown>, atividadeNomeFallback)
            : null,
        )
        .filter((item): item is ReservaAtividadeRelatorioItem => item != null),
    );
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const listRaw = record.reservas ?? record.items ?? record.data ?? record.results;

  if (!Array.isArray(listRaw)) {
    return [];
  }

  const fromPresenca = listRaw
    .map((item) => {
      const normalizedPresenca = normalizeReservaPresenca(item);

      if (normalizedPresenca && !normalizedPresenca.cancelada) {
        return mapReservaPresencaToRelatorioItem(normalizedPresenca, atividadeNomeFallback);
      }

      if (typeof item === 'object' && item != null) {
        return normalizeRelatorioItemFromRecord(item as Record<string, unknown>, atividadeNomeFallback);
      }

      return null;
    })
    .filter((item): item is ReservaAtividadeRelatorioItem => item != null);

  return dedupeReservasAtividadeRelatorio(fromPresenca);
}

export function mapReservaRecordToRelatorioItem(
  raw: unknown,
  atividadeNomeFallback = '',
): ReservaAtividadeRelatorioItem | null {
  const normalizedPresenca = normalizeReservaPresenca(raw);

  if (normalizedPresenca && !normalizedPresenca.cancelada) {
    return mapReservaPresencaToRelatorioItem(normalizedPresenca, atividadeNomeFallback);
  }

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const relatorioFromRecord = normalizeRelatorioItemFromRecord(record, atividadeNomeFallback);

  if (relatorioFromRecord) {
    return relatorioFromRecord;
  }

  return mapReservaUsuarioToRelatorioItem(record, atividadeNomeFallback);
}

function mapReservaUsuarioToRelatorioItem(
  record: Record<string, unknown>,
  atividadeNomeFallback: string,
): ReservaAtividadeRelatorioItem | null {
  const reservaId =
    normalizeRecordId(record.reservasdamha_id ?? record.reservasDamha_id) ??
    normalizeRecordId(record.reserva_id ?? record.reservaId ?? record.id);

  if (reservaId == null) {
    return null;
  }

  const usersId =
    normalizeRecordId(record.users_id ?? record.usersId ?? record.usuario_id) ??
    normalizeRecordId(record.responsavel_id ?? record.responsavelId) ??
    0;
  const dataHora =
    readTimestamp(record, ['dataAtividade', 'data_atividade', 'dataHora', 'data_hora']) ?? 0;
  const atividadeId =
    normalizeRecordId(record.atividades_id ?? record.atividade_id ?? record.atividadeId) ?? 0;
  const nestedUsuario = record.usuario ?? record._users ?? record.users;
  const nestedUsuarioRecord =
    nestedUsuario && typeof nestedUsuario === 'object'
      ? (nestedUsuario as Record<string, unknown>)
      : null;

  return {
    reservaId,
    usersId,
    nome:
      readString(record, ['nome_usuario', 'nomeUsuario', 'nome']) ||
      (nestedUsuarioRecord ? readString(nestedUsuarioRecord, ['nome_usuario', 'nome']) : '') ||
      readString(record, ['usuario_nome']) ||
      'Participante',
    atividadeId,
    atividadeNome:
      readString(record, ['atividade_nome', 'atividadeNome', 'atividade']) || atividadeNomeFallback,
    dataHora,
    presencaStatus: resolvePresencaRelatorioStatus(
      normalizeBoolean(record.presente),
      readString(record, ['presencaRegistradaEm', 'presenca_registrada_em']) || null,
      normalizeRecordId(record.presencaRegistradaPor ?? record.presenca_registrada_por),
    ),
  };
}

export function mapReservaUsuarioToRelatorioItemFromNormalized(
  reserva: ReservaUsuario,
  raw: unknown,
  atividadeNomeFallback = '',
): ReservaAtividadeRelatorioItem | null {
  if (reserva.cancelado) {
    return null;
  }

  if (raw && typeof raw === 'object') {
    const mapped = mapReservaRecordToRelatorioItem(raw, atividadeNomeFallback);

    if (mapped) {
      return mapped;
    }
  }

  return {
    reservaId: reserva.reservasdamha_id > 0 ? reserva.reservasdamha_id : reserva.id,
    usersId: reserva.users_id,
    nome: reserva.nome?.trim() || reserva.responsavel?.nome?.trim() || 'Participante',
    atividadeId: reserva.atividades_id,
    atividadeNome: reserva.atividade?.trim() || atividadeNomeFallback,
    dataHora: reserva.dataAtividade,
    presencaStatus: 'ausente',
  };
}
