import type { ListaEsperaRegistro } from '@/types/lista-espera';
import type { RelatorioListaEsperaOrdem } from '@/types/relatorio-lista-espera';

export type GerarRelatorioListaEsperaPdfInput = {
  localNome: string;
  atividadeNome: string;
  ordemLabel: string;
  registros: ListaEsperaRegistro[];
  ordem: RelatorioListaEsperaOrdem;
};

export async function gerarRelatorioListaEsperaPdf(
  _input: GerarRelatorioListaEsperaPdfInput,
): Promise<void> {
  throw new Error('A geração de PDF está disponível apenas na versão web.');
}
