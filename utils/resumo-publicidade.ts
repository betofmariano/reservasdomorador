import type {
  MostrarPubliXanoResponse,
  PublicidadeApp,
  PublicidadeEmpresaTotais,
  ResumoPublicidadeResult,
} from '@/types/publicidade';
import { buildDateTimeTimestamp, formatDateLabel, formatTimeLabel } from '@/utils/jogos-time';

function emptyTotais(empresa: string): PublicidadeEmpresaTotais {
  return {
    empresa,
    MatchPlace: 0,
    MatchPoint: 0,
    MatchTraining: 0,
    MatchGame: 0,
    total: 0,
  };
}

export function normalizePublicidadeApp(
  value: string | null | undefined,
): PublicidadeApp | null {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();

  if (!raw) {
    return null;
  }

  if (raw.startsWith('matchplace')) return 'MatchPlace';
  if (raw.startsWith('matchpoint')) return 'MatchPoint';
  if (raw.startsWith('matchtraining')) return 'MatchTraining';
  if (raw.startsWith('matchgame')) return 'MatchGame';

  return null;
}

export function empresasPublicidadeIguais(left: string, right: string): boolean {
  return left.trim().localeCompare(right.trim(), 'pt-BR', { sensitivity: 'base' }) === 0;
}

export function agregarResumoPublicidade(
  records: MostrarPubliXanoResponse[],
  dataInicio: number,
  dataFinal: number,
  empresaFiltro?: string | null,
): ResumoPublicidadeResult {
  const filtro = empresaFiltro?.trim() || null;
  const byEmpresa = new Map<string, PublicidadeEmpresaTotais>();
  const totais = emptyTotais('Total');

  for (const record of records) {
    const app = normalizePublicidadeApp(record.aplicativo);
    if (!app) {
      continue;
    }

    const empresa = String(record.publi ?? '').trim() || '(sem empresa)';

    if (filtro && !empresasPublicidadeIguais(empresa, filtro)) {
      continue;
    }

    const row = byEmpresa.get(empresa) ?? emptyTotais(empresa);
    row[app] += 1;
    row.total += 1;
    byEmpresa.set(empresa, row);

    totais[app] += 1;
    totais.total += 1;
  }

  const empresas = [...byEmpresa.values()].sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return a.empresa.localeCompare(b.empresa, 'pt-BR', { sensitivity: 'base' });
  });

  return { dataInicio, dataFinal, empresas, totais };
}

export function formatPublicidadeInteiro(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatPublicidadePeriodo(inicio: Date, fim: Date): string {
  return `${formatDateLabel(inicio)} - ${formatTimeLabel(inicio)} a ${formatDateLabel(fim)} - ${formatTimeLabel(fim)}`;
}

export function inicioDoMesAtual(reference = new Date()): Date {
  return new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
}

export function fimDoDiaAtual(reference = new Date()): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    23,
    59,
    0,
    0,
  );
}

export function timestampInicioPeriodo(date: Date, time: Date): number {
  return buildDateTimeTimestamp(date, time);
}

/** Inclui o último minuto quando o horário é 23:59. */
export function timestampFimPeriodo(date: Date, time: Date): number {
  const endOfMinute = time.getHours() === 23 && time.getMinutes() === 59 ? 999 : 0;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    endOfMinute ? 59 : 0,
    endOfMinute,
  ).getTime();
}

export function getPublicidadeMinSelectableDate(): Date {
  return new Date(2020, 0, 1, 0, 0, 0, 0);
}
