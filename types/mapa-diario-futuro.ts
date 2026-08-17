export type MapaMensalPorSemanaReservaResumo = {
  id: number;
  nome: string;
  users_id: number;
  foto: string | null;
  dataAtividade: number;
  created_at: number;
  cancelado: boolean;
};

export type MapaDiarioFuturoAtividadeInfo = {
  atividade: string;
  observacao: string;
  capacidade: number;
  controlePresenca: boolean;
  horasAntes: number;
  minutosCancelamento: number;
  tolerancia: number;
};

export type MapaDiarioFuturoItem = {
  id: number;
  academias_id: number;
  atividades_id: number;
  atividade: string;
  dataAtividade: number;
  dataLiberacao: number | null;
  limiteCancelamento: number | null;
  limiteReserva: number | null;
  capacidade: number;
  ocupacao: number;
  totalPresentes: number;
  contagemFeita: boolean;
  tipoProgramacao: string;
  hora: number;
  minutos: number;
  semana: number | null;
  reservasdamha_id: number;
  conteudo: string | null;
  /** Unidade da atividade (ex.: Q1/Q2). 0/null = sem unidade / legado. */
  atividadeunidade_id: number | null;
  /** Nome curto da unidade para aba (vindo do mapa aninhado ou cadastro). */
  atividadeUnidadeNome: string | null;
  reservaMensalPorSemana: MapaMensalPorSemanaReservaResumo | null;
  atividadeInfo: MapaDiarioFuturoAtividadeInfo | null;
};

export type ReservaAtividadeOption = {
  id: number;
  nome: string;
  academias_id: number;
  localNome: string;
  observacao: string;
};

export type ReservaLocalOption = {
  id: number;
  nome: string;
};

export type ReservaAtividadesData = {
  locais: ReservaLocalOption[];
  atividades: ReservaAtividadeOption[];
};
