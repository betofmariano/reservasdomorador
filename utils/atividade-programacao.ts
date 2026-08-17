import type { Atividade } from '@/types/atividade';

export type AtividadePadrao = 'Diaria' | 'Semanal' | 'MensalPorSemana';

const MENSAL_POR_SEMANA_ALIASES = new Set([
  'mensalporsemana',
  'mensal por semana',
  'mensalsemana',
  'padraomensalporsemana',
]);

function normalizeProgramacaoKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Decide o padrão da atividade.
 * Campo vazio / ausente → Diária (compatível com o legado).
 */
export function resolveAtividadePadrao(
  tipoProgramacao: string | null | undefined,
): AtividadePadrao {
  const raw = (tipoProgramacao ?? '').trim();

  if (!raw) {
    return 'Diaria';
  }

  const key = normalizeProgramacaoKey(raw);

  if (key === 'diaria') {
    return 'Diaria';
  }

  if (key === 'semanal') {
    return 'Semanal';
  }

  if (MENSAL_POR_SEMANA_ALIASES.has(key.replace(/\s/g, '')) || MENSAL_POR_SEMANA_ALIASES.has(key)) {
    return 'MensalPorSemana';
  }

  if (key === 'mensalporsemana') {
    return 'MensalPorSemana';
  }

  return 'Diaria';
}

export function atividadeUsaMensalPorSemana(
  atividade: { tipoProgramacao?: string | null } | null | undefined,
): boolean {
  return resolveAtividadePadrao(atividade?.tipoProgramacao) === 'MensalPorSemana';
}

/** Fluxo MensalPorSemana: só `atividade.tipoProgramacao`. */
export function resolveUsaMensalPorSemana(params: {
  atividade?: Pick<Atividade, 'tipoProgramacao'> | { tipoProgramacao?: string | null } | null;
}): boolean {
  return atividadeUsaMensalPorSemana(params.atividade);
}

/** Limite semanal do associado: só `atividade.limiteReservasSemana` (> 0). */
export function resolveLimiteReservasSemana(params: {
  atividade?: Pick<Atividade, 'limiteReservasSemana'> | { limiteReservasSemana?: number | null } | null;
}): number | null {
  const fromAtividade = params.atividade?.limiteReservasSemana;

  if (typeof fromAtividade === 'number' && Number.isFinite(fromAtividade) && fromAtividade > 0) {
    return fromAtividade;
  }

  return null;
}

/** Local oferece MensalPorSemana se alguma atividade estiver com esse tipo. */
export function academiaOfereceMensalPorSemana(params: {
  atividades?: Array<Pick<Atividade, 'tipoProgramacao'> | { tipoProgramacao?: string | null }> | null;
}): boolean {
  return (params.atividades ?? []).some((atividade) => atividadeUsaMensalPorSemana(atividade));
}
