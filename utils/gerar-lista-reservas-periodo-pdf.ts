import type {
  ListaReservasPeriodoResumo,
  ReservaPeriodoRelatorioItem,
} from '@/types/lista-reservas-periodo';

export type GerarListaReservasPeriodoPdfInput = {
  localNome: string;
  periodoInicioLabel: string;
  periodoFimLabel: string;
  reservas: ReservaPeriodoRelatorioItem[];
  resumo: ListaReservasPeriodoResumo;
};

export async function gerarListaReservasPeriodoPdf(
  _input: GerarListaReservasPeriodoPdfInput,
): Promise<void> {
  throw new Error('A geração de PDF está disponível apenas na versão web.');
}
