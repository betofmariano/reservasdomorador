export type SolicitarRecuperacaoRequest = {
  telefoneLimpo: string;
};

export type SolicitarRecuperacaoResponse = {
  message?: string;
  sucesso?: boolean;
  usado?: boolean;
  codigovalidado?: boolean;
  telefoneLimpo?: string | number;
};

export type ConsultarRecuperacaoRequest = {
  telefoneLimpo: string;
};

export type ConsultarRecuperacaoResponse = {
  message?: string;
  sucesso?: boolean;
  usado?: boolean;
  codigovalidado?: boolean;
  telefoneLimpo?: string | number;
  created_at?: string | number;
};

export type ValidarRecuperacaoRequest = {
  telefoneLimpo: string;
  codigo: string;
};

export type ValidarRecuperacaoResponse = {
  valido?: boolean;
  sucesso?: boolean;
  message?: string;
  users_id?: number;
  usersId?: number;
  id?: number;
};

export type AlterarSenhaRecuperacaoRequest = {
  telefoneLimpo: string;
  codigo: string;
  novaSenha: string;
};

export type AlterarSenhaRecuperacaoResponse = {
  message?: string;
  sucesso?: boolean;
};

export type AlterarSenhaAutenticadaResponse = {
  message?: string;
  sucesso?: boolean;
};

export type AlterarPasswordUserRequest = {
  users_id: number;
  password: string;
};
