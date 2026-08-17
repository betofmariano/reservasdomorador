import type {
  ListaUsuariosSuspensosOrdem,
  ListaUsuariosSuspensosOrdemOption,
  ListaUsuariosSuspensosStatusFilter,
  ListaUsuariosSuspensosStatusOption,
  UsersBloqueadoRegistro,
} from '@/types/users-bloqueados';

import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';

export const LISTA_USUARIOS_SUSPENSOS_TODAS_ATIVIDADES_LABEL = 'Todas as atividades';

export const LISTA_USUARIOS_SUSPENSOS_STATUS_OPTIONS: ListaUsuariosSuspensosStatusOption[] = [
  { value: 'ativos', label: 'Suspensões ativas' },
  { value: 'encerrados', label: 'Suspensões encerradas' },
  { value: 'todos', label: 'Todas as suspensões' },
];

export const LISTA_USUARIOS_SUSPENSOS_ORDEM_OPTIONS: ListaUsuariosSuspensosOrdemOption[] = [
  { value: 'data_final', label: 'Data final' },
  { value: 'nome', label: 'Nome' },
  { value: 'atividade', label: 'Atividade' },
];

export function formatSuspensaoStatusLabel(encerrado: boolean): string {
  return encerrado ? 'Encerrada' : 'Ativa';
}

export function formatUsersBloqueadoDeleteSummary(item: UsersBloqueadoRegistro): string {
  return [
    item.nome,
    item.atividade,
    `Início: ${formatarDataHoraMatchPlace(item.dataInicio, { includeYear: true })}`,
    `Fim: ${formatarDataHoraMatchPlace(item.dataFinal, { includeYear: true })}`,
  ].join('\n');
}

export function filterUsersBloqueadosByAtividade(
  registros: UsersBloqueadoRegistro[],
  atividadesId: number | null,
): UsersBloqueadoRegistro[] {
  if (atividadesId == null) {
    return registros;
  }

  return registros.filter((item) => item.atividades_id === atividadesId);
}

export function filterUsersBloqueadosByStatus(
  registros: UsersBloqueadoRegistro[],
  statusFilter: ListaUsuariosSuspensosStatusFilter,
): UsersBloqueadoRegistro[] {
  switch (statusFilter) {
    case 'ativos':
      return registros.filter((item) => !item.encerrado);
    case 'encerrados':
      return registros.filter((item) => item.encerrado);
    default:
      return registros;
  }
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'pt-BR', { sensitivity: 'base' });
}

export function sortUsersBloqueadosRegistros(
  registros: UsersBloqueadoRegistro[],
  ordem: ListaUsuariosSuspensosOrdem,
): UsersBloqueadoRegistro[] {
  const sorted = [...registros];

  sorted.sort((left, right) => {
    switch (ordem) {
      case 'nome':
        return compareText(left.nome, right.nome);
      case 'atividade':
        return compareText(left.atividade, right.atividade) || compareText(left.nome, right.nome);
      case 'data_final':
      default:
        return right.dataFinal - left.dataFinal || compareText(left.nome, right.nome);
    }
  });

  return sorted;
}
