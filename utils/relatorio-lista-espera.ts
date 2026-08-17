import type { ListaEsperaRegistro } from '@/types/lista-espera';
import type {
  RelatorioListaEsperaOrdem,
  RelatorioListaEsperaOrdemOption,
} from '@/types/relatorio-lista-espera';
import { formatarDataHoraMatchPlace } from '@/utils/programacao-atividades';

export const RELATORIO_LISTA_ESPERA_ORDEM_OPTIONS: RelatorioListaEsperaOrdemOption[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'data_atividade', label: 'Data da atividade' },
];

export const RELATORIO_LISTA_ESPERA_TODAS_ATIVIDADES_LABEL = 'Todas as atividades';

export function filterListaEsperaByAtividade(
  registros: ListaEsperaRegistro[],
  atividadesId: number | null,
): ListaEsperaRegistro[] {
  if (atividadesId == null) {
    return registros;
  }

  return registros.filter((registro) => registro.atividades_id === atividadesId);
}

export function sortListaEsperaRegistros(
  registros: ListaEsperaRegistro[],
  ordem: RelatorioListaEsperaOrdem,
): ListaEsperaRegistro[] {
  const sorted = [...registros];

  if (ordem === 'data_atividade') {
    return sorted.sort((left, right) => {
      const leftValue = left.dataAtividade ?? 0;
      const rightValue = right.dataAtividade ?? 0;

      if (leftValue !== rightValue) {
        return rightValue - leftValue;
      }

      return right.created_at - left.created_at;
    });
  }

  return sorted.sort((left, right) => right.created_at - left.created_at);
}

export function formatListaEsperaAvisoLabel(registro: ListaEsperaRegistro): string {
  if (registro.avisado) {
    return '✓';
  }

  if (registro.avisar) {
    return 'Aguardando';
  }

  return '';
}

export function formatListaEsperaDeleteSummary(registro: ListaEsperaRegistro): string {
  const nome = registro.nome.trim() || 'Participante';
  const atividade = registro.atividade.trim() || 'Atividade';
  const dataAtividade = formatarDataHoraMatchPlace(registro.dataAtividade, { includeYear: true });
  const dataEntrada = formatarDataHoraMatchPlace(registro.created_at, { includeYear: true });

  return `${nome}\n${atividade}\nData da atividade: ${dataAtividade}\nEntrada: ${dataEntrada}`;
}
