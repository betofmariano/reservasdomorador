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
  endereco?: string | null;
  /** @deprecated Use `endereco`. */
  complemento?: string | null;
  _users?: {
    nome?: string | null;
    Foto?: string | null;
    foto?: string | null;
    telefoneConfirmado?: string | null;
    telefoneLimpo?: string | null;
    email?: string | null;
    matricula?: string | null;
    endereco?: string | null;
    /** @deprecated Use `endereco`. */
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

export type GestorUsuarioStatusFilter = 'todos' | 'pendente' | 'aprovado' | 'bloqueado';

export type GestorMoradorItem = {
  userslocalId: number;
  usersId: number;
  nome: string;
  telefone: string;
  telefoneLimpo: string;
  endereco: string;
  foto: string | null;
  aprovado: boolean;
  bloqueado: boolean;
};

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
  endereco: string;
  foto: string | null;
  ultimoAcesso: number | null;
  ultimaEntrada: string;
  gestor: boolean;
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
  endereco?: string;
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
