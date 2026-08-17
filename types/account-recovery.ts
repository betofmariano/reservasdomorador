export type EsqueceuCadastroRequest = {
  nome: string;
  telefoneLimpo: string;
};

/** GET /pesquisarUsuario?nome=&telefoneLimpo= (4 últimos dígitos) */
export type PesquisarUsuarioRequest = {
  nome: string;
  telefoneLimpo: string;
};

export type PesquisarUsuarioResponse = {
  message?: string;
  sucesso?: boolean;
  usuarios?: EsqueceuCadastroUsuarioMatch[];
  usuariosEncontrados?: EsqueceuCadastroUsuarioMatch[];
};

export type EsqueceuCadastroResponse = {
  message?: string;
  sucesso?: boolean;
};

export type EsqueceuCadastroUsuarioMatch = {
  usersId?: number | null;
  nome: string;
  telefoneLimpo?: string;
  academiasId?: number | null;
  associacaoNome?: string;
};
