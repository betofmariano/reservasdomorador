export type SolicitacaoAlteracaoPayload = {
  dataJogo: number;
  academias_id: number;
  rotina: string;
  nome: string;
  larguraPagina: number;
  pagina: string;
  local: string;
  users_id: number;
};

export type SolicitacaoAlteracaoTipo = 'nome' | 'telefone' | 'foto';

export const SOLICITACAO_ROTINA = {
  nome: 'alteração de nome',
  telefone: 'alteração de telefone',
  foto: 'alteração de foto',
} as const;
