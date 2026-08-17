import type {
  ListaReservasPeriodoSortMode,
  ReservaPeriodoRelatorioItem,
} from '@/types/lista-reservas-periodo';
import {
  RELATORIO_RETROACTIVE_DAYS,
  getRelatorioMaxSelectableDate,
  getRelatorioMinStartDate,
  matchesNomeFilter,
} from '@/utils/lista-reservas-atividade';

export {
  RELATORIO_RETROACTIVE_DAYS,
  combineDateAndTime,
  createDefaultPeriodoHoje,
  getEndOfDay,
  getRelatorioMaxSelectableDate,
  getRelatorioMinStartDate,
  getStartOfDay,
} from '@/utils/lista-reservas-atividade';

export function validateListaReservasPeriodoConsulta(input: {
  dataHoraInicial: Date;
  dataHoraFinal: Date;
}): string | null {
  const inicio = input.dataHoraInicial.getTime();
  const fim = input.dataHoraFinal.getTime();

  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) {
    return 'Informe data inicial e final.';
  }

  if (fim < inicio) {
    return 'O fim do período não pode ser anterior ao início.';
  }

  const minStart = getRelatorioMinStartDate().getTime();
  if (inicio < minStart) {
    return `A data inicial não pode ser anterior a ${RELATORIO_RETROACTIVE_DAYS} dias.`;
  }

  return null;
}

export function filterReservasPeriodoByAtividadeNome(
  items: ReservaPeriodoRelatorioItem[],
  filtroNome: string,
): ReservaPeriodoRelatorioItem[] {
  const trimmed = filtroNome.trim();

  if (!trimmed) {
    return items;
  }

  return items.filter((item) => matchesNomeFilter(item.atividadeNome, trimmed));
}

export function sortReservasPeriodoRelatorio(
  items: ReservaPeriodoRelatorioItem[],
  mode: ListaReservasPeriodoSortMode,
): ReservaPeriodoRelatorioItem[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    switch (mode) {
      case 'atividade_desc':
        return b.atividadeNome.localeCompare(a.atividadeNome, 'pt-BR') || b.qtdeReservas - a.qtdeReservas;
      case 'reservas_desc':
        return b.qtdeReservas - a.qtdeReservas || a.atividadeNome.localeCompare(b.atividadeNome, 'pt-BR');
      case 'reservas_asc':
        return a.qtdeReservas - b.qtdeReservas || a.atividadeNome.localeCompare(b.atividadeNome, 'pt-BR');
      case 'atividade_asc':
      default:
        return a.atividadeNome.localeCompare(b.atividadeNome, 'pt-BR') || a.qtdeReservas - b.qtdeReservas;
    }
  });

  return sorted;
}

export function getReservasPeriodoSortModeLabel(mode: ListaReservasPeriodoSortMode): string {
  switch (mode) {
    case 'atividade_desc':
      return 'Atividade Z–A';
    case 'reservas_desc':
      return 'Mais reservas';
    case 'reservas_asc':
      return 'Menos reservas';
    default:
      return 'Atividade A–Z';
  }
}

export function buildReservasPeriodoResumo(
  consultaItems: ReservaPeriodoRelatorioItem[],
  exibindoItems: ReservaPeriodoRelatorioItem[],
) {
  const totalReservas = consultaItems.reduce((sum, item) => sum + item.qtdeReservas, 0);
  const totalPresentes = consultaItems.reduce((sum, item) => sum + item.qtdePresente, 0);
  const totalAusentes = consultaItems.reduce((sum, item) => sum + item.qtdeAusente, 0);

  return {
    totalAtividades: consultaItems.length,
    totalExibindo: exibindoItems.length,
    totalReservas,
    totalPresentes,
    totalAusentes,
  };
}
