export type UsersLocalApiRecord = {
  id: number;
  nome: string;
  users_id: number;
  academias_id: number;
  aprovado?: boolean;
  bloqueado?: boolean;
  inativo?: boolean;
  gestor?: boolean;
  professor?: boolean;
  administrador?: boolean;
  ultimoAcesso?: number | null;
  telefoneLimpo?: string | null;
  socioTitulo?: string | null;
  complemento?: string | null;
  _users?: {
    Foto?: string | null;
    foto?: string | null;
    telefoneConfirmado?: string | null;
    telefoneLimpo?: string | null;
    email?: string | null;
    matricula?: string | null;
    complemento?: string | null;
    gestor?: boolean;
    professor?: boolean;
    administrador?: boolean;
    bloqueado?: boolean;
  } | null;
};

export type UsuarioListItem = {
  id: number;
  userslocalId: number;
  nome: string;
  foto: string | null;
  telefoneLimpo: string;
};

export type GestorUsuarioStatusFilter =
  | 'todos'
  | 'inativos'
  | 'novos'
  | 'gestores'
  | 'professores'
  | 'bloqueados';

export type GestorUsuarioSortField = 'nome' | 'ultimaEntrada';
export type GestorUsuarioSortDirection = 'asc' | 'desc';

export type GestorUsuarioListItem = {
  userslocalId: number;
  usersId: number;
  email: string;
  nome: string;
  telefone: string;
  telefoneLimpo: string;
  telefoneConfirmado: string;
  socio: string;
  complemento: string;
  foto: string | null;
  ultimoAcesso: number | null;
  ultimaEntrada: string;
  gestor: boolean;
  professor: boolean;
  administrador: boolean;
  aprovado: boolean;
  bloqueado: boolean;
  inativo: boolean;
};

export type UpdateUsersLocalPayload = {
  aprovado?: boolean;
  bloqueado?: boolean;
  gestor?: boolean;
  professor?: boolean;
  nome?: string;
  ultimoAcesso?: number;
  socioTitulo?: string;
  complemento?: string;
};

export type UpdateUsersPayload = {
  aprovado?: boolean;
  gestor?: boolean;
  administrador?: boolean;
  telefoneConfirmado?: string;
  nome?: string;
  localPrioritario?: number | null;
};

export type UsersApiRecord = {
  id: number;
  gestor?: boolean;
  administrador?: boolean;
  aprovado?: boolean;
  telefoneConfirmado?: string;
  nome?: string;
};
