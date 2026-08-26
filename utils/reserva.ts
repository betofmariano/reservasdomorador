import {
  CRIAR_RESERVA_MESSAGES,
  CRIAR_RESERVA_RESULTADO,
} from '@/constants/criar-reserva-messages';
import {
  type CriarReservaResponse,
  type ReservaOutcome,
} from '@/types/reserva';

function unwrapReservaResponseRecord(data: unknown): Record<string, unknown> {
  if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object') {
    return data[0] as Record<string, unknown>;
  }

  if (data && typeof data === 'object') {
    return data as Record<string, unknown>;
  }

  return {};
}

export function unwrapReservaResponse(data: unknown): CriarReservaResponse {
  return unwrapReservaResponseRecord(data) as CriarReservaResponse;
}

export function normalizeJogoCriadoId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function extractReservaIdFromCriarReservaResponse(data: CriarReservaResponse): number | null {
  const record = unwrapReservaResponseRecord(data);

  const directCandidates = [
    record.IDReserva,
    record.idReserva,
    record.reservas_id,
    record.reserva_id,
    record.reservaId,
    record.jogoCriadoId,
    record.jogo_criado_id,
    record.jogoCriado_id,
    record.jogo_id,
    record.jogos_id,
    record.id,
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeJogoCriadoId(candidate);

    if (normalized) {
      return normalized;
    }
  }

  for (const nestedKey of ['jogo', 'jogoCriado', 'jogo_criado', 'reserva'] as const) {
    const nested = record[nestedKey];

    if (!nested || typeof nested !== 'object') {
      continue;
    }

    const nestedRecord = nested as Record<string, unknown>;
    const normalized =
      normalizeJogoCriadoId(nestedRecord.IDReserva) ??
      normalizeJogoCriadoId(nestedRecord.id) ??
      normalizeJogoCriadoId(nestedRecord.jogos_id) ??
      normalizeJogoCriadoId(nestedRecord.reservas_id);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

/** @deprecated Use extractReservaIdFromCriarReservaResponse */
export const extractJogoCriadoIdFromReservaResponse = extractReservaIdFromCriarReservaResponse;

function normalizeCriarReservaSucesso(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (value === true || value === 'true') {
    return CRIAR_RESERVA_RESULTADO.sucesso;
  }

  if (value === false || value === 'false') {
    return CRIAR_RESERVA_RESULTADO.usuarioBloqueado;
  }

  return null;
}

export function extractCriarReservaSucesso(data: unknown): number | null {
  const record = unwrapReservaResponseRecord(data);

  const fromField =
    normalizeCriarReservaSucesso(record.sucesso ?? record.Sucesso) ??
    normalizeCriarReservaSucesso(record.resultadoOperacao);

  if (fromField != null) {
    return fromField;
  }

  if (extractReservaIdFromCriarReservaResponse(record as CriarReservaResponse)) {
    return CRIAR_RESERVA_RESULTADO.sucesso;
  }

  return null;
}

export function isReservaResponseSuccess(data: unknown): boolean {
  return extractCriarReservaSucesso(data) === CRIAR_RESERVA_RESULTADO.sucesso;
}

function extractReservaApiMessage(record: Record<string, unknown>): string | null {
  for (const key of ['mensagem', 'message', 'erro', 'error'] as const) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const sucesso = record.sucesso ?? record.Sucesso;

  if (typeof sucesso === 'string') {
    const trimmed = sucesso.trim();

    if (
      trimmed &&
      Number.isNaN(Number(trimmed)) &&
      trimmed.toLowerCase() !== 'true' &&
      trimmed.toLowerCase() !== 'false' &&
      trimmed.toLowerCase() !== 'sucesso'
    ) {
      return trimmed;
    }
  }

  return null;
}

function buildReservaOutcome(
  sucesso: number | null,
  message: string,
  options: Pick<ReservaOutcome, 'refreshMapa' | 'showModal'>,
): ReservaOutcome {
  return {
    sucesso,
    message,
    refreshMapa: options.refreshMapa,
    showModal: options.showModal,
  };
}

export function resolveReservaOutcome(data: unknown): ReservaOutcome {
  const record = unwrapReservaResponseRecord(data);
  const apiMessage = extractReservaApiMessage(record);
  const sucesso = extractCriarReservaSucesso(data);

  switch (sucesso) {
    case CRIAR_RESERVA_RESULTADO.sucesso:
      return buildReservaOutcome(
        sucesso,
        apiMessage ?? CRIAR_RESERVA_MESSAGES.success,
        { refreshMapa: false, showModal: false },
      );
    case CRIAR_RESERVA_RESULTADO.usuarioBloqueado:
      return buildReservaOutcome(
        sucesso,
        apiMessage ?? CRIAR_RESERVA_MESSAGES.usuarioBloqueado,
        { refreshMapa: false, showModal: true },
      );
    case CRIAR_RESERVA_RESULTADO.jaReservado:
      return buildReservaOutcome(
        sucesso,
        apiMessage ?? CRIAR_RESERVA_MESSAGES.jaReservado,
        { refreshMapa: true, showModal: true },
      );
    case CRIAR_RESERVA_RESULTADO.relogioAdiantado:
      return buildReservaOutcome(
        sucesso,
        apiMessage ?? CRIAR_RESERVA_MESSAGES.relogioAdiantado,
        { refreshMapa: false, showModal: true },
      );
    default:
      console.log('Resposta de reserva inesperada:', record);

      return buildReservaOutcome(
        sucesso,
        apiMessage ?? CRIAR_RESERVA_MESSAGES.unexpected,
        { refreshMapa: false, showModal: true },
      );
  }
}

export function resolveReservaErrorMessage(error: unknown): string {
  const fallback = 'Não foi possível reservar o horário. Tente novamente.';

  if (error instanceof Error) {
    const message = error.message.trim();

    if (!message) {
      return fallback;
    }

    if (message.includes('conectar')) {
      return 'Não foi possível conectar ao servidor. Tente novamente.';
    }

    return message;
  }

  return fallback;
}
