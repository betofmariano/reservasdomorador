import type { LoginResponse } from '@/services/auth-service';

export type LoginErrorCode =
  | 'phone_not_found'
  | 'wrong_password'
  | 'token_failed'
  | 'generic';

export type ParsedLoginResult =
  | { status: 'success'; authToken: string }
  | { status: 'error'; code: LoginErrorCode; message: string };

export const LOGIN_USER_MESSAGES = {
  phoneNotFound: 'Telefone não encontrado. Verifique o número ou crie sua conta.',
  wrongPassword: 'Senha incorreta.',
  wrongPasswordModal:
    'Não foi possível entrar com a senha informada. Se você esqueceu ou não tem certeza da senha, toque no botão "Esqueci minha senha" abaixo. Enviaremos um código no seu WhatsApp — aguarde alguns instantes até receber a mensagem — para você cadastrar uma senha nova.',
  tokenFailed:
    'Sua senha está correta, mas não foi possível iniciar a sessão agora. Isso costuma ser instabilidade momentânea do servidor. Aguarde alguns segundos e tente entrar novamente.',
  generic: 'Não foi possível concluir o login. Tente novamente.',
  sessionExpired: 'Sua sessão expirou. Faça login novamente.',
} as const;

export const LOGIN_ERROR_TITLES: Record<LoginErrorCode, string> = {
  phone_not_found: 'Telefone não encontrado',
  wrong_password: 'Senha incorreta',
  token_failed: 'Não foi possível entrar',
  generic: 'Erro no login',
};

function toBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }

  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }

  return undefined;
}

function hasAuthToken(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPhoneNotFound(response: LoginResponse): boolean {
  const encontrado = toBoolean(response.encontrado);

  if (encontrado === false) {
    return true;
  }

  if (typeof response.totalEncontrado === 'number' && response.totalEncontrado <= 0) {
    return true;
  }

  return false;
}

/**
 * Resposta nova: senhaCorreta. Mantém fallback legado (sucesso) por segurança.
 */
export function parseLoginSafeResponse(response: LoginResponse): ParsedLoginResult {
  if (isPhoneNotFound(response)) {
    return {
      status: 'error',
      code: 'phone_not_found',
      message: LOGIN_USER_MESSAGES.phoneNotFound,
    };
  }

  if (hasAuthToken(response.authToken)) {
    return {
      status: 'success',
      authToken: response.authToken.trim(),
    };
  }

  const senhaCorreta = toBoolean(response.senhaCorreta);
  const sucesso = toBoolean(response.sucesso);
  const encontrado = toBoolean(response.encontrado);

  if (senhaCorreta === false) {
    return {
      status: 'error',
      code: 'wrong_password',
      message: LOGIN_USER_MESSAGES.wrongPassword,
    };
  }

  if (senhaCorreta === true) {
    return {
      status: 'error',
      code: 'token_failed',
      message: LOGIN_USER_MESSAGES.tokenFailed,
    };
  }

  // Legado: sucesso/encontrado (endpoint antigo)
  if (encontrado === true && sucesso === false) {
    return {
      status: 'error',
      code: 'wrong_password',
      message: LOGIN_USER_MESSAGES.wrongPassword,
    };
  }

  if (encontrado === true && sucesso === true) {
    return {
      status: 'error',
      code: 'token_failed',
      message: LOGIN_USER_MESSAGES.tokenFailed,
    };
  }

  if (sucesso === false) {
    return {
      status: 'error',
      code: 'wrong_password',
      message: LOGIN_USER_MESSAGES.wrongPassword,
    };
  }

  return {
    status: 'error',
    code: 'generic',
    message: LOGIN_USER_MESSAGES.generic,
  };
}
