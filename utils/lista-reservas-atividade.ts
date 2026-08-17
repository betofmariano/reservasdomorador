import type {
  ListaReservasAtividadePresencaFilter,
  ListaReservasAtividadeSortMode,
  PresencaRelatorioStatus,
  ReservaAtividadeRelatorioItem,
} from '@/types/lista-reservas-atividade';
import type { ReservaPresenca } from '@/types/presenca';
import { slugifyPresencaFilename } from '@/utils/presenca-datetime';

export const RELATORIO_RETROACTIVE_DAYS = 90;

export function getRelatorioMinStartDate(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - RELATORIO_RETROACTIVE_DAYS);
  return date;
}

export function getRelatorioMaxSelectableDate(referenceDate = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function createDefaultPeriodoHoje(): {
  inicio: Date;
  fim: Date;
} {
  const inicio = getStartOfDay(new Date());
  const fim = getEndOfDay(new Date());

  return { inicio, fim };
}

export function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

export function validateListaReservasAtividadeConsulta(input: {
  atividadesId: number | null;
  dataHoraInicial: Date;
  dataHoraFinal: Date;
}): string | null {
  if (input.atividadesId == null) {
    return 'Selecione uma atividade.';
  }

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

export function resolvePresencaRelatorioStatus(
  presente: boolean,
  _presencaRegistradaEm?: string | null,
  _presencaRegistradaPor?: number | null,
): PresencaRelatorioStatus {
  return presente ? 'presente' : 'ausente';
}

export function mapReservaPresencaToRelatorioItem(
  reserva: ReservaPresenca,
  atividadeNomeFallback = '',
): ReservaAtividadeRelatorioItem {
  const dataHora = reserva.dataAtividade ?? Date.parse(reserva.dataHora) ?? 0;

  return {
    reservaId: reserva.reservaId,
    usersId: reserva.usuarioId,
    nome: reserva.nomeUsuario.trim() || 'Participante',
    atividadeId: reserva.atividadeId,
    atividadeNome: reserva.atividadeNome.trim() || atividadeNomeFallback,
    dataHora,
    presencaStatus: resolvePresencaRelatorioStatus(
      reserva.presente,
      reserva.presencaRegistradaEm,
      reserva.presencaRegistradaPor,
    ),
  };
}

export function normalizeSearchText(value: string): string {
  return slugifyPresencaFilename(value.trim()).replace(/-/g, ' ');
}

export function matchesNomeFilter(nome: string, filtro: string): boolean {
  const query = normalizeSearchText(filtro);

  if (!query) {
    return true;
  }

  const normalizedNome = normalizeSearchText(nome);
  return normalizedNome.includes(query);
}

export function filterReservasAtividadeByPresenca(
  items: ReservaAtividadeRelatorioItem[],
  filtro: ListaReservasAtividadePresencaFilter,
): ReservaAtividadeRelatorioItem[] {
  switch (filtro) {
    case 'presentes':
      return items.filter((item) => item.presencaStatus === 'presente');
    case 'ausentes':
      return items.filter((item) => item.presencaStatus !== 'presente');
    default:
      return items;
  }
}

export function filterReservasAtividadeByNome(
  items: ReservaAtividadeRelatorioItem[],
  filtroNome: string,
): ReservaAtividadeRelatorioItem[] {
  const trimmed = filtroNome.trim();

  if (!trimmed) {
    return items;
  }

  return items.filter((item) => matchesNomeFilter(item.nome, trimmed));
}

export function sortReservasAtividadeRelatorio(
  items: ReservaAtividadeRelatorioItem[],
  mode: ListaReservasAtividadeSortMode,
): ReservaAtividadeRelatorioItem[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    switch (mode) {
      case 'data_desc':
        return b.dataHora - a.dataHora || a.nome.localeCompare(b.nome, 'pt-BR');
      case 'nome_asc':
        return a.nome.localeCompare(b.nome, 'pt-BR') || a.dataHora - b.dataHora;
      case 'nome_desc':
        return b.nome.localeCompare(a.nome, 'pt-BR') || a.dataHora - b.dataHora;
      case 'data_asc':
      default:
        return a.dataHora - b.dataHora || a.nome.localeCompare(b.nome, 'pt-BR');
    }
  });

  return sorted;
}

export function getPresencaRelatorioLabel(status: PresencaRelatorioStatus): string {
  switch (status) {
    case 'presente':
      return 'Presente';
    case 'ausente':
    case 'nao_registrado':
    default:
      return 'Ausente';
  }
}

export function getPresencaFilterLabel(filtro: ListaReservasAtividadePresencaFilter): string {
  switch (filtro) {
    case 'presentes':
      return 'Presentes';
    case 'ausentes':
      return 'Ausentes';
    default:
      return 'Todos';
  }
}

export function getSortModeLabel(mode: ListaReservasAtividadeSortMode): string {
  switch (mode) {
    case 'data_desc':
      return 'Data decrescente';
    case 'nome_asc':
      return 'Nome A–Z';
    case 'nome_desc':
      return 'Nome Z–A';
    default:
      return 'Data crescente';
  }
}

export function dedupeReservasAtividadeRelatorio(
  items: ReservaAtividadeRelatorioItem[],
): ReservaAtividadeRelatorioItem[] {
  const byId = new Map<number, ReservaAtividadeRelatorioItem>();

  for (const item of items) {
    byId.set(item.reservaId, item);
  }

  return [...byId.values()];
}
