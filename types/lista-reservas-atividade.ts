export type PresencaRelatorioStatus = 'presente' | 'ausente' | 'nao_registrado';

export type ListaReservasAtividadeSortMode =
  | 'data_asc'
  | 'data_desc'
  | 'nome_asc'
  | 'nome_desc';

export type ListaReservasAtividadePresencaFilter = 'todos' | 'presentes' | 'ausentes';

export type ReservaAtividadeRelatorioItem = {
  reservaId: number;
  usersId: number;
  nome: string;
  atividadeId: number;
  atividadeNome: string;
  dataHora: number;
  presencaStatus: PresencaRelatorioStatus;
};

export type ListaReservasAtividadeConsultaParams = {
  atividadesId: number;
  dataHoraInicial: number;
  dataHoraFinal: number;
};

export type ListaReservasAtividadeResumo = {
  totalConsulta: number;
  totalExibindo: number;
  presentes: number;
  ausentes: number;
};
