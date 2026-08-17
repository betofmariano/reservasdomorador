export const LOGIN_TOTAL_ENCONTRADO_MESSAGES = {
  phoneNotFound: 'Telefone não encontrado.',
  duplicatePhones: (total: number) =>
    `Existem ${total} cadastros com esse número de telefone. Um WhatsApp com os cadastros encontrados foi enviado para este número.`,
} as const;

export const LOGIN_TOTAL_ENCONTRADO_TITLES = {
  phoneNotFound: 'Telefone não encontrado',
  duplicatePhones: 'Telefone duplicado',
} as const;

export const LOGIN_WRONG_PASSWORD_TITLE = 'Senha incorreta';

export const LOGIN_WRONG_PASSWORD_MESSAGE =
  "Não foi possível entrar com a senha informada. Se você esqueceu ou não tem certeza da senha, toque no botão 'Esqueci minha senha' abaixo. Enviaremos um código no seu WhatsApp — aguarde alguns instantes até receber a mensagem — para você cadastrar uma senha nova.";
