import type { JogoJogador } from '@/types/jogo';

export type ReservaUsuario = {
  id: number;
  dataAtividade: number;
  quadra: number;
  academias_id: number;
  atividades_id: number;
  semana: number | null;
  mapadiariodamha_id: number;
  reservasdamha_id: number;
  mapadiario_id: number;
  atividadeunidade_id: number | null;
  unidadeNome: string | null;
  atividade: string | null;
  cancelado: boolean;
  users_id: number;
  nome: string | null;
  foto: string | null;
  responsavel_id: number;
  limiteCancelamento: number | null;
  jogoDuplas: boolean;
  adversario_id: number;
  parceiro1_id: number;
  parceiro2_id: number;
  created_at: number;
  cancelamentoAutomatico: number | null;
  responsavel: JogoJogador | null;
  adversario: JogoJogador | null;
  parceiro1?: JogoJogador | null;
  parceiro2?: JogoJogador | null;
};

export type ReservasUsuarioResponse = ReservaUsuario[];
