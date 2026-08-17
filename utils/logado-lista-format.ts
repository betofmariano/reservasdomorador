import type {
  LogadoClubeOption,
  LogadoGestorFilter,
  LogadoRecord,
  LogadoSortDirection,
  LogadoSortField,
} from '@/types/logado';
import { normalizeSearchText } from '@/utils/search-text';
import { formatBrazilianMobilePhone, stripPhoneDigits } from '@/utils/phone-mask';

const MIN_SEARCH_LENGTH = 3;

export const LOGADO_GESTOR_FILTER_OPTIONS: ReadonlyArray<{
  value: LogadoGestorFilter;
  label: string;
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'yes', label: 'Somente gestores' },
  { value: 'no', label: 'Somente não gestores' },
];

export function getLogadoClubeNome(logado: LogadoRecord): string {
  const local = logado.local?.trim();
  const academiaNome = logado._academias?.nome?.trim();
  const localNome = logado._academias?.nome?.trim();
  return local || academiaNome || localNome || '—';
}

export function formatLogadoCreatedAt(timestamp: number | null): string {
  if (!timestamp) {
    return '—';
  }

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month} - ${hours}:${minutes}`;
}

export function getLogadoTelefoneLimpo(logado: LogadoRecord): string {
  const fromRelation = logado._users?.telefoneLimpo?.trim();

  if (fromRelation) {
    return stripPhoneDigits(fromRelation);
  }

  return stripPhoneDigits(logado.telefoneLimpo ?? '');
}

export function formatLogadoTelefone(logado: LogadoRecord): string {
  const telefoneLimpo = getLogadoTelefoneLimpo(logado);

  if (!telefoneLimpo) {
    return '—';
  }

  return formatBrazilianMobilePhone(telefoneLimpo) || telefoneLimpo;
}

export function extractLogadoClubOptions(logados: LogadoRecord[]): LogadoClubeOption[] {
  const clubs = new Map<number, string>();

  for (const logado of logados) {
    if (logado.academias_id <= 0) {
      continue;
    }

    clubs.set(logado.academias_id, getLogadoClubeNome(logado));
  }

  return Array.from(clubs.entries())
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function compareTextValues(
  a: string,
  b: string,
  direction: LogadoSortDirection,
): number {
  const result = a.localeCompare(b, 'pt-BR');
  return direction === 'desc' ? -result : result;
}

function compareCreatedAt(
  a: number | null,
  b: number | null,
  direction: LogadoSortDirection,
): number {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return direction === 'desc' ? b - a : a - b;
}

export function sortLogados(
  logados: LogadoRecord[],
  field: LogadoSortField,
  direction: LogadoSortDirection,
): LogadoRecord[] {
  return [...logados].sort((a, b) => {
    if (field === 'nome') {
      return compareTextValues(a.nome ?? '', b.nome ?? '', direction);
    }

    const dateCompare = compareCreatedAt(a.created_at, b.created_at, direction);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const clubeCompare = compareTextValues(getLogadoClubeNome(a), getLogadoClubeNome(b), direction);

    if (clubeCompare !== 0) {
      return clubeCompare;
    }

    return compareTextValues(a.nome ?? '', b.nome ?? '', direction);
  });
}

export function matchesLogadoSearch(logado: LogadoRecord, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || normalizedQuery.length < MIN_SEARCH_LENGTH) {
    return true;
  }

  const createdLabel = formatLogadoCreatedAt(logado.created_at);
  const searchableValues = [
    logado.nome,
    logado.email,
    logado.telefoneLimpo,
    getLogadoTelefoneLimpo(logado),
    formatLogadoTelefone(logado),
    logado.cod,
    logado.plataforma,
    logado.dispositivo,
    getLogadoClubeNome(logado),
    String(logado.users_id),
    createdLabel,
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

export function filterLogadosByClub(
  logados: LogadoRecord[],
  selectedClubId: number | null,
): LogadoRecord[] {
  if (selectedClubId === null) {
    return logados;
  }

  return logados.filter((logado) => logado.academias_id === selectedClubId);
}

export function filterLogadosByGestor(
  logados: LogadoRecord[],
  gestorFilter: LogadoGestorFilter,
): LogadoRecord[] {
  if (gestorFilter === 'all') {
    return logados;
  }

  if (gestorFilter === 'yes') {
    return logados.filter((logado) => logado.gestor === true);
  }

  return logados.filter((logado) => logado.gestor !== true);
}

export function formatLogadoBoolean(value: boolean): string {
  return value ? 'Sim' : 'Não';
}
