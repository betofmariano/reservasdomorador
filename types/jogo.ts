export type JogoJogador = {
  nome: string;
  email: string;
  telefone?: string;
  foto: string;
};

export type Jogo = {
  id: number;
  dataJogo: number | null;
  quadra: number;
  academias_id: number;
  users_id?: number;
  responsavel_id: number;
  adversario_id: number;
  jogoDuplas: boolean;
  cancelado: boolean;
  parceiro1_id: number;
  parceiro2_id: number;
  mapadiario_id: number;
  created_at: number;
  dataCancelamento: number | null;
  responsavelCancelamento: number;
  cancelamentoAutomatico: number | null;
  limiteCancelamento: number | null;
  limiteTrocaParceiros: number | null;
  dataJogoFinal: number | null;
  responsavel: JogoJogador | null;
  adversario: JogoJogador | null;
  parceiro1?: JogoJogador | null;
  parceiro2?: JogoJogador | null;
};

export type JogosResponse = Jogo[];

export type JogosFilters = {
  academias_id: number;
  dataCorte: number;
};

export type JogoTipo = 'simples' | 'duplas';

export type JogoParticipante = {
  nome: string;
  foto: string | null;
};

export type JogoParticipantesView = {
  tipo: JogoTipo;
  dupla1: JogoParticipante[];
  dupla2: JogoParticipante[];
};

export type CancelarJogoPayload = {
  jogos_id: number;
  users_id: number;
};

export type SendWzapEsperaPayload = {
  jogos_id: number;
  academias_id: number;
};

export type SendWzapEsperaMatchPlacePayload = {
  academias_id: number;
  atividades_id: number;
  dataAtividade: number;
  publicidade_id?: number;
};

export type SendWzapEsperaResponse = {
  publicidade_id: number;
};

export type SendWzapAdicionarPayload = {
  jogos_id: number;
  academias_id: number;
  publicidade_id: number;
};

export type SendWzapAdicionarResponse = {
  publicidade_id: number;
};

export type SendWzapReservaPayload = {
  reservas_id: number;
};

export type SendWzapReservaResponse = {
  publicidade_id?: number;
  [key: string]: unknown;
};

export type CancelarJogoResponse = {
  id: number;
  dataJogo: number | null;
  quadra: number;
  academias_id: number;
  responsavel_id: number;
  adversario_id: number;
  jogoDuplas: boolean;
  cancelado: boolean;
  parceiro1_id: number;
  parceiro2_id: number;
  mapadiario_id: number;
  created_at: number;
  dataCancelamento: number | null;
  responsavelCancelamento: number;
  cancelamentoAutomatico: number | null;
  limiteCancelamento: number | null;
  limiteTrocaParceiros: number | null;
  dataJogoFinal: number | null;
};
