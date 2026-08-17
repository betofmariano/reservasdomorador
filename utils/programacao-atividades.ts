import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type { AtividadeProgramada } from '@/types/atividade-programada';
import {
  RELATORIO_RETROACTIVE_DAYS,
  getRelatorioMinStartDate,
} from '@/utils/lista-reservas-atividade';
import {
  formatMapaDiarioFuturoDataLabel,
  resolveMapaDiarioFuturoDataLiberacao,
} from '@/utils/mapa-diario-futuro';
import { normalizeSearchText } from '@/utils/search-text';

export const PROGRAMACAO_FUTURE_DAYS = 90;

export function createDefaultProgramacaoStartDate(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getProgramacaoMaxSelectableDate(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + PROGRAMACAO_FUTURE_DAYS);
  return date;
}

export function validateProgramacaoAtividadesConsulta(input: { dataInicial: Date }): string | null {
  const inicio = input.dataInicial.getTime();

  if (!Number.isFinite(inicio)) {
    return 'Informe a data inicial.';
  }

  const minStart = getRelatorioMinStartDate().getTime();
  if (inicio < minStart) {
    return `A data não pode ser anterior a ${RELATORIO_RETROACTIVE_DAYS} dias.`;
  }

  return null;
}

export function filterAtividadesProgramadasFromDate(
  items: AtividadeProgramada[],
  dataInicial: Date,
): AtividadeProgramada[] {
  const inicio = dataInicial.getTime();

  return items.filter((item) => item.dataAtividade >= inicio);
}

export function formatarDataHoraMatchPlace(
  valor: number | null | undefined,
  options?: { includeYear?: boolean },
): string {
  if (valor == null || !Number.isFinite(valor) || valor <= 0) {
    return '—';
  }

  const date = new Date(valor);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const datePart = options?.includeYear ? `${day}/${month}/${year}` : `${day}/${month}`;

  return `${datePart} - ${hours}:${minutes}`;
}

export function mapMapaDiarioFuturoToAtividadeProgramada(
  item: MapaDiarioFuturoItem,
): AtividadeProgramada {
  return {
    id: item.id,
    academias_id: item.academias_id,
    atividades_id: item.atividades_id,
    atividadeNome: item.atividade.trim(),
    dataAtividade: item.dataAtividade,
    dataLiberacao: resolveMapaDiarioFuturoDataLiberacao(item),
    limiteReserva: item.limiteReserva,
    limiteCancelamento: item.limiteCancelamento,
    vagas: item.capacidade > 0 ? item.capacidade : null,
    reservas: item.ocupacao,
  };
}

export function filterAtividadesProgramadasByLocal(
  items: AtividadeProgramada[],
  academiasId: number,
): AtividadeProgramada[] {
  return items.filter((item) => item.academias_id === academiasId);
}

export function sortAtividadesProgramadas(items: AtividadeProgramada[]): AtividadeProgramada[] {
  return [...items].sort((a, b) => {
    const byDate = a.dataAtividade - b.dataAtividade;

    if (byDate !== 0) {
      return byDate;
    }

    return a.atividadeNome.localeCompare(b.atividadeNome, 'pt-BR');
  });
}

function normalizeProgramacaoSearchQuery(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, ' ');
}

function buildProgramacaoSearchValues(item: AtividadeProgramada): string[] {
  const dataAtividadeLabels = [
    formatarDataHoraMatchPlace(item.dataAtividade, { includeYear: true }),
    formatarDataHoraMatchPlace(item.dataAtividade, { includeYear: false }),
    formatMapaDiarioFuturoDataLabel(item.dataAtividade),
  ];
  const dataLiberacaoLabels = [
    formatarDataHoraMatchPlace(item.dataLiberacao, { includeYear: true }),
    formatarDataHoraMatchPlace(item.dataLiberacao, { includeYear: false }),
  ];
  const limiteReservaLabels = [
    formatarDataHoraMatchPlace(item.limiteReserva, { includeYear: true }),
    formatarDataHoraMatchPlace(item.limiteReserva, { includeYear: false }),
  ];
  const limiteCancelamentoLabels = [
    formatarDataHoraMatchPlace(item.limiteCancelamento, { includeYear: true }),
    formatarDataHoraMatchPlace(item.limiteCancelamento, { includeYear: false }),
  ];

  return [
    item.atividadeNome,
    String(item.vagas ?? ''),
    String(item.reservas),
    ...dataAtividadeLabels,
    ...dataLiberacaoLabels,
    ...limiteReservaLabels,
    ...limiteCancelamentoLabels,
  ];
}

export function filterAtividadesProgramadasBySearch(
  items: AtividadeProgramada[],
  filtro: string,
): AtividadeProgramada[] {
  const query = normalizeProgramacaoSearchQuery(filtro);

  if (!query) {
    return items;
  }

  return items.filter((item) => {
    const searchableValues = buildProgramacaoSearchValues(item);
    return searchableValues.some((value) =>
      normalizeProgramacaoSearchQuery(value).includes(query),
    );
  });
}

export function formatAtividadeProgramadaVagas(vagas: number | null): string {
  if (vagas == null) {
    return '—';
  }

  return String(vagas);
}

export type ParseCapacidadeProgramadaResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function parseCapacidadeProgramada(
  raw: string,
  reservasAtuais = 0,
): ParseCapacidadeProgramadaResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, error: 'Informe a capacidade.' };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: 'A capacidade deve ser um número inteiro.' };
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value) || value < 1) {
    return { ok: false, error: 'A capacidade deve ser no mínimo 1.' };
  }

  if (reservasAtuais > 0 && value < reservasAtuais) {
    return {
      ok: false,
      error: `A capacidade não pode ser menor que as reservas atuais (${reservasAtuais}).`,
    };
  }

  return { ok: true, value };
}
