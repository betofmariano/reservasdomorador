import { SOLICITACAO_ROTINA } from '@/types/solicitacao-alteracao';
import type { Acesso, AcessoSortDirection, AcessoSortField } from '@/types/acesso';
import { normalizeSearchText } from '@/utils/search-text';
import { normalizePhotoUrl } from '@/utils/user-photo';

const FOTO_ALTERACAO_ROTINA = SOLICITACAO_ROTINA.foto.toLowerCase();

export function isFotoAlteracaoAcesso(acesso: Acesso): boolean {
  const rotina = (acesso.rotina ?? '').trim().toLowerCase();
  return rotina === FOTO_ALTERACAO_ROTINA;
}

export function getAcessoPhotoUrl(acesso: Acesso): string | null {
  if (!isFotoAlteracaoAcesso(acesso)) {
    return null;
  }

  return normalizePhotoUrl(acesso.pagina);
}

function containsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword);
}

function containsLogin(text: string): boolean {
  return containsKeyword(text, 'login');
}

function containsPinWord(text: string): boolean {
  return ` ${text} `.includes(' PIN ');
}

function isLoginOrPinRotina(rotina: string): boolean {
  return containsLogin(rotina) || containsPinWord(rotina);
}

export function isLoginAcesso(acesso: Acesso): boolean {
  if (isLoginOrPinRotina(acesso.rotina ?? '')) {
    return true;
  }

  return containsLogin(acesso.pagina ?? '');
}

export function filterAcessosWithoutLogin(acessos: Acesso[]): Acesso[] {
  return acessos.filter((acesso) => !isLoginAcesso(acesso));
}

export function filterAcessosWithLogin(acessos: Acesso[]): Acesso[] {
  return acessos.filter((acesso) => isLoginAcesso(acesso));
}

export function formatAcessoCreatedAt(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const centiseconds = String(Math.floor(date.getMilliseconds() / 10)).padStart(2, '0');

  return `${day}/${month} - ${hours}:${minutes}:${seconds}.${centiseconds}`;
}

export function formatAcessoDataJogo(timestamp: number | null): string {
  if (!timestamp) {
    return '-';
  }

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month} - ${hours}:${minutes}`;
}

type SortAcessosOptions = {
  sortByDataJogoRotinaCreatedAt?: boolean;
};

function compareTextValues(
  a: string,
  b: string,
  direction: AcessoSortDirection,
): number {
  const result = a.localeCompare(b, 'pt-BR');
  return direction === 'desc' ? -result : result;
}

function compareDataJogo(
  a: number | null,
  b: number | null,
  direction: AcessoSortDirection,
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

function compareCreatedAt(
  a: number,
  b: number,
  direction: AcessoSortDirection,
): number {
  return direction === 'desc' ? b - a : a - b;
}

export function sortAcessos(
  acessos: Acesso[],
  field: AcessoSortField,
  direction: AcessoSortDirection,
  options?: SortAcessosOptions,
): Acesso[] {
  return [...acessos].sort((a, b) => {
    if (field === 'id') {
      return direction === 'desc' ? b.id - a.id : a.id - b.id;
    }

    const dateCompare = compareDataJogo(a.dataJogo, b.dataJogo, direction);

    if (!options?.sortByDataJogoRotinaCreatedAt) {
      return dateCompare;
    }

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const rotinaCompare = compareTextValues(a.rotina ?? '', b.rotina ?? '', direction);

    if (rotinaCompare !== 0) {
      return rotinaCompare;
    }

    return compareCreatedAt(a.created_at, b.created_at, direction);
  });
}

const MIN_SEARCH_LENGTH = 3;

export function matchesAcessoSearch(acesso: Acesso, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || normalizedQuery.length < MIN_SEARCH_LENGTH) {
    return true;
  }

  const createdLabel = formatAcessoCreatedAt(acesso.created_at);
  const dataJogoLabel = formatAcessoDataJogo(acesso.dataJogo);

  const searchableValues = [
    acesso.nome,
    acesso.email,
    acesso.local,
    acesso.pagina,
    acesso.rotina,
    createdLabel,
    dataJogoLabel,
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(normalizedQuery));
}
