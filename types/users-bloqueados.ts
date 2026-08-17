export type UsersBloqueadoRegistro = {
  id: number;
  created_at: number;
  userslocal_id: number;
  users_id: number;
  atividades_id: number;
  dataInicio: number;
  dataFinal: number;
  encerrado: boolean;
  nome: string;
  telefone: string;
  atividade: string;
  academias_id: number;
};

export type CreateUsersBloqueadosPayload = {
  userslocal_id: number;
  users_id: number;
  atividades_id: number;
  dataInicio: number;
  dataFinal: number;
  dias: number;
};

export type ListaUsuariosSuspensosStatusFilter = 'todos' | 'ativos' | 'encerrados';

export type ListaUsuariosSuspensosOrdem = 'data_final' | 'nome' | 'atividade';

export type ListaUsuariosSuspensosOrdemOption = {
  value: ListaUsuariosSuspensosOrdem;
  label: string;
};

export type ListaUsuariosSuspensosStatusOption = {
  value: ListaUsuariosSuspensosStatusFilter;
  label: string;
};
