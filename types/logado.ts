export type LogadoPayload = {
  users_id: number;
  created_at: number;
  nome: string;
  email: string;
  academias_id: number;
  aprovado: boolean;
  gestor: boolean;
  administrador: boolean;
  bloqueado: boolean;
  larguraPagina: number;
  telefoneLimpo: string;
  plataforma: string;
  dispositivo: string;
};

export type LogadoResponse = null;

export type LogadoRecord = {
  id: number;
  created_at: number | null;
  users_id: number;
  nome: string;
  academias_id: number;
  local: string;
  aprovado: boolean;
  logadoXano: boolean;
  email: string;
  gestor: boolean;
  administrador: boolean;
  bloqueado: boolean;
  larguraPagina: number;
  telefoneLimpo: string;
  plataforma: string;
  dispositivo: string;
  cod: string;
  logadoBubble?: boolean;
  nomeBubble?: string;
  _users?: {
    nome: string;
    telefoneLimpo: string;
  } | null;
  _academias?: {
    nome: string;
  } | null;
};

export type LogadosResponse = LogadoRecord[];

export type LogadoSortField = 'data' | 'nome';

export type LogadoSortDirection = 'asc' | 'desc';

export type LogadoGestorFilter = 'all' | 'yes' | 'no';

export type LogadoClubeOption = {
  id: number;
  nome: string;
};
