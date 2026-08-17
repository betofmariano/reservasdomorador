import type { HorarioPresencaOption, ReservaPresenca, ReservasAtividadeHoraResponse } from '@/types/presenca';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import {
  formatPresencaDataHoraDescricao,
  formatPresencaHorarioLabel,
  timestampToIsoDate,
} from '@/utils/presenca-datetime';
import {
  normalizeBoolean,
  normalizeRecordId,
  readPersonPhoto,
  readString,
  readTimestamp,
} from '@/utils/normalize-api-fields';
import { extractPhotoUrlFromApiPayload, normalizePhotoUrl } from '@/utils/user-photo';

export function resolveTogglePresencaValue(presente: boolean): boolean {
  return presente !== true;
}

export function resolvePresencaFromToggleResponse(
  response: unknown,
  fallbackPresente: boolean,
): boolean {
  if (!response || typeof response !== 'object') {
    return fallbackPresente;
  }

  const record = response as Record<string, unknown>;

  if ('presente' in record) {
    return normalizeBoolean(record.presente);
  }

  return fallbackPresente;
}

export function readPresencaRegistradaEmFromResponse(response: unknown): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const value = readString(response as Record<string, unknown>, [
    'presencaRegistradaEm',
    'presenca_registrada_em',
  ]);

  return value || null;
}

export function mergeReservaPresencaFromToggleResponse(
  current: ReservaPresenca,
  response: unknown,
  fallbackPresente: boolean,
): ReservaPresenca {
  const normalized = normalizeReservaPresenca(response);
  const presente = normalized?.presente ?? resolvePresencaFromToggleResponse(response, fallbackPresente);
  const presencaRegistradaEm = readPresencaRegistradaEmFromResponse(response);

  if (normalized && normalized.reservaId === current.reservaId) {
    return {
      ...current,
      ...normalized,
      foto: normalized.foto ?? current.foto,
      nomeUsuario: normalized.nomeUsuario || current.nomeUsuario,
      presente,
      presencaRegistradaEm: presente
        ? presencaRegistradaEm ?? normalized.presencaRegistradaEm ?? current.presencaRegistradaEm
        : null,
      presencaRegistradaPor: presente
        ? normalized.presencaRegistradaPor ?? current.presencaRegistradaPor
        : null,
    };
  }

  return {
    ...current,
    presente,
    presencaRegistradaEm: presente ? presencaRegistradaEm ?? current.presencaRegistradaEm : null,
    presencaRegistradaPor: presente ? current.presencaRegistradaPor : null,
  };
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readReservaPresencaFoto(record: Record<string, unknown>): string | null {
  const direct = extractPhotoUrlFromApiPayload(record);

  if (direct) {
    return direct;
  }

  for (const key of ['usuario', '_users', 'users', 'user']) {
    const nested = record[key];

    if (!nested || typeof nested !== 'object') {
      continue;
    }

    const nestedPhoto =
      extractPhotoUrlFromApiPayload(nested) ||
      normalizePhotoUrl(readPersonPhoto(nested as Record<string, unknown>));

    if (nestedPhoto) {
      return nestedPhoto;
    }
  }

  return null;
}

export function normalizeReservaPresenca(item: unknown): ReservaPresenca | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const reservaId = normalizeRecordId(record.id ?? record.reserva_id ?? record.reservas_id);

  if (reservaId == null) {
    return null;
  }

  const usuarioId =
    normalizeRecordId(record.users_id ?? record.usersxano_id ?? record.usuario_id) ?? 0;
  const nestedUsuario = record.usuario ?? record._users ?? record.users;
  const nestedUsuarioRecord =
    nestedUsuario && typeof nestedUsuario === 'object'
      ? (nestedUsuario as Record<string, unknown>)
      : null;

  const dataAtividade = readTimestamp(record, ['dataAtividade', 'data_atividade']);
  const data = readString(record, ['data']) || (dataAtividade ? timestampToIsoDate(dataAtividade) : '');
  const horario =
    readString(record, ['horario']) ||
    (dataAtividade ? formatPresencaHorarioLabel(dataAtividade) : '');

  return {
    reservaId,
    usuarioId,
    nomeUsuario:
      readString(record, ['nome_usuario', 'nomeUsuario', 'nome']) ||
      (nestedUsuarioRecord ? readString(nestedUsuarioRecord, ['nome_usuario', 'nome']) : '') ||
      'Participante',
    foto: readReservaPresencaFoto(record),
    atividadeId:
      normalizeRecordId(record.atividades_id ?? record.atividade_id) ??
      normalizeRecordId(record.atividadesId) ??
      0,
    atividadeNome:
      readString(record, ['nome_atividade', 'atividadeNome', 'atividade']) ||
      readString(record, ['atividade_nome']),
    mapaDiarioId:
      normalizeRecordId(record.mapadiario_id ?? record.mapaDiario_id ?? record.mapa_diario_id) ?? 0,
    mapaHorarioId: normalizeRecordId(
      record.mapaHorario_id ?? record.mapa_horario_id ?? record.mapaHorarioId,
    ),
    data,
    horario,
    dataHora:
      readString(record, ['dataHora', 'data_hora']) ||
      (dataAtividade ? new Date(dataAtividade).toISOString() : ''),
    ordemReserva: readNumber(record, ['ordemReserva', 'ordem_reserva']),
    presente: normalizeBoolean(record.presente),
    presencaRegistradaEm:
      readString(record, ['presencaRegistradaEm', 'presenca_registrada_em']) || null,
    presencaRegistradaPor: normalizeRecordId(
      record.presencaRegistradaPor ?? record.presenca_registrada_por,
    ),
    cancelada: normalizeBoolean(record.cancelada ?? record.cancelado),
    limiteCancelamento: readTimestamp(record, ['limiteCancelamento', 'limite_cancelamento']),
    createdAt: readTimestamp(record, ['created_at', 'createdAt']),
    dataAtividade,
  };
}

export function normalizeReservasAtividadeHoraResponse(raw: unknown): ReservasAtividadeHoraResponse {
  if (Array.isArray(raw)) {
    return {
      reservas: raw
        .map((item) => normalizeReservaPresenca(item))
        .filter((item): item is ReservaPresenca => item !== null && !item.cancelada),
    };
  }

  if (!raw || typeof raw !== 'object') {
    return { reservas: [] };
  }

  const record = raw as Record<string, unknown>;
  const reservasRaw = record.reservas ?? record.items ?? record.data;
  const reservas = Array.isArray(reservasRaw)
    ? reservasRaw
        .map((item) => normalizeReservaPresenca(item))
        .filter((item): item is ReservaPresenca => item !== null && !item.cancelada)
    : [];

  const listaEsperaRaw = record.lista_espera ?? record.listaEspera;
  const lista_espera = Array.isArray(listaEsperaRaw)
    ? listaEsperaRaw
        .map((item) => normalizeReservaPresenca(item))
        .filter((item): item is ReservaPresenca => item !== null && !item.cancelada)
    : undefined;

  return {
    mapaDiario:
      record.mapaDiario && typeof record.mapaDiario === 'object'
        ? (record.mapaDiario as ReservasAtividadeHoraResponse['mapaDiario'])
        : record.mapa_diario && typeof record.mapa_diario === 'object'
          ? (record.mapa_diario as ReservasAtividadeHoraResponse['mapaDiario'])
          : null,
    quantidade:
      typeof record.quantidade === 'number'
        ? record.quantidade
        : typeof record.quantidade === 'string'
          ? Number(record.quantidade)
          : reservas.length,
    reservas,
    lista_espera,
  };
}

export function mapMapaDiarioFuturoToHorarioPresenca(
  item: MapaDiarioFuturoItem,
): HorarioPresencaOption {
  return {
    mapaDiarioId: item.id,
    mapaHorarioId: null,
    atividadeId: item.atividades_id,
    data: timestampToIsoDate(item.dataAtividade),
    horario: formatPresencaHorarioLabel(item.dataAtividade),
    dataHora: new Date(item.dataAtividade).toISOString(),
    descricao: formatPresencaDataHoraDescricao(item.dataAtividade),
    dataAtividade: item.dataAtividade,
  };
}
