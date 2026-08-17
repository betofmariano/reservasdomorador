import type {
  ReservaAtividadeRelatorioItem,
  ListaReservasAtividadeResumo,
} from '@/types/lista-reservas-atividade';

export type GerarListaReservasAtividadePdfInput = {
  localNome: string;
  atividadeNome: string;
  periodoInicioLabel: string;
  periodoFimLabel: string;
  reservas: ReservaAtividadeRelatorioItem[];
  resumo: ListaReservasAtividadeResumo;
};

export async function gerarListaReservasAtividadePdf(
  _input: GerarListaReservasAtividadePdfInput,
): Promise<void> {
  throw new Error('A geração de PDF está disponível apenas na versão web.');
}
