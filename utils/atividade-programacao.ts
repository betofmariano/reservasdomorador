import type { Atividade } from '@/types/atividade';

export type AtividadePadrao = 'Diaria' | 'Semanal' | 'MensalPorSemana';

/**
 * Reservas do Morador usa somente o fluxo mensal por semana.
 * Não consultar tipoProgramacao, mensalSemana ou outros campos do MatchPlace para escolher o fluxo.
 */
export function resolveAtividadePadrao(
  _tipoProgramacao?: string | null,
): AtividadePadrao {
  return 'MensalPorSemana';
}

export function atividadeUsaMensalPorSemana(
  _atividade?: { tipoProgramacao?: string | null } | null,
): boolean {
  return true;
}

/** Fluxo do morador: sempre MensalPorSemana. */
export function resolveUsaMensalPorSemana(_params?: {
  atividade?: Pick<Atividade, 'tipoProgramacao'> | { tipoProgramacao?: string | null } | null;
}): boolean {
  return true;
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

/** Local oferece MensalPorSemana: neste aplicativo, sempre. */
export function academiaOfereceMensalPorSemana(_params?: {
  atividades?: Array<Pick<Atividade, 'tipoProgramacao'> | { tipoProgramacao?: string | null }> | null;
}): boolean {
  return true;
}
