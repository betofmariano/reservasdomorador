export type Acesso = {
  id: number;
  created_at: number;
  dataJogo: number | null;
  academias_id: number;
  rotina: string;
  nome: string;
  email: string;
  larguraPagina: number;
  pagina: string;
  local: string;
  users_id: number;
};

export type AcessosResponse = Acesso[];

export type AcessoSortField = 'dataJogo' | 'id';

export type AcessoSortDirection = 'asc' | 'desc';
