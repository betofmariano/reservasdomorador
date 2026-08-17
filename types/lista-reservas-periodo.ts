export type ReservaPeriodoRelatorioItem = {
  id: number;
  academiasId: number;
  atividadesId: number;
  atividadeNome: string;
  qtdeReservas: number;
  qtdePresente: number;
  qtdeAusente: number;
  dataInicial: number;
  dataFinal: number;
};

export type ListaReservasPeriodoConsultaParams = {
  dataHoraInicial: number;
  dataHoraFinal: number;
};

export type ListaReservasPeriodoSortMode =
  | 'atividade_asc'
  | 'atividade_desc'
  | 'reservas_desc'
  | 'reservas_asc';

export type ListaReservasPeriodoResumo = {
  totalAtividades: number;
  totalExibindo: number;
  totalReservas: number;
  totalPresentes: number;
  totalAusentes: number;
};
