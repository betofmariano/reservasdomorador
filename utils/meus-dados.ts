import { ASSOCIACAO_LOCAL_LABELS } from '@/constants/associacao-local-labels';
import { BRAZILIAN_MOBILE_PHONE_DIGITS, stripPhoneDigits } from '@/utils/phone-mask';
import type { User } from '@/types/user';

export const MEUS_DADOS_MESSAGES = {
  nomeRequired: 'Informe seu nome.',
  nomeIncomplete: 'Informe nome e sobrenome.',
  telefoneInvalid: 'Informe um telefone válido.',
  complementoRequired: ASSOCIACAO_LOCAL_LABELS.complementoObrigatorio,
  noChanges: 'Nenhuma alteração foi informada.',
  nomeSuccess: 'Nome atualizado com sucesso.',
  nomeUpdateError: 'Não foi possível atualizar seu nome. Tente novamente.',
  complementoSuccess: 'Complemento atualizado com sucesso.',
  telefoneSuccess: 'Solicitação de telefone enviada com sucesso.',
  telefoneSuccessHint: 'A alteração de telefone será analisada antes de ser aplicada.',
  success: 'Alterações enviadas com sucesso.',
  successHint: 'As alterações serão aplicadas após análise.',
  partialError: 'Algumas alterações não puderam ser enviadas. Tente novamente.',
  localRequired: 'Selecione um local prioritário antes de enviar alterações.',
  sendError: 'Não foi possível enviar a solicitação. Tente novamente.',
  unsavedTitle: 'Alterações não enviadas',
  unsavedMessage: 'Deseja sair sem enviar suas alterações?',
  photoUpdateError: 'Não foi possível atualizar sua foto. Tente novamente.',
  photoSuccess: 'Foto atualizada com sucesso. O gestor poderá conferir na lista de acessos.',
  passwordUpdateError: 'Não foi possível alterar a senha. Tente novamente.',
};

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function capitalizeWord(word: string): string {
  if (!word) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatRegisteredPersonName(value: string): string {
  return normalizePersonName(value)
    .toLowerCase()
    .split(' ')
    .map(capitalizeWord)
    .join(' ');
}

export function hasFullPersonName(value: string): boolean {
  const words = normalizePersonName(value).split(' ').filter((word) => word.length > 0);

  return words.length >= 2;
}

export function validatePersonName(value: string): string | null {
  if (!normalizePersonName(value)) {
    return MEUS_DADOS_MESSAGES.nomeRequired;
  }

  if (!hasFullPersonName(value)) {
    return MEUS_DADOS_MESSAGES.nomeIncomplete;
  }

  return null;
}

export function validateMeusDadosNome(value: string): string | null {
  return validatePersonName(value);
}

export function getOriginalPhoneDigits(user: User): string {
  return stripPhoneDigits(
    user.telefoneConfirmado ||
      user.telefoneLimpo ||
      user.telefoneCorrigido ||
      user.telefone ||
      '',
  );
}

export function validateMeusDadosTelefoneDigits(digits: string): string | null {
  if (digits.length !== BRAZILIAN_MOBILE_PHONE_DIGITS) {
    return MEUS_DADOS_MESSAGES.telefoneInvalid;
  }

  return null;
}

export function validateMeusDadosComplemento(value: string): string | null {
  if (!value.trim()) {
    return MEUS_DADOS_MESSAGES.complementoRequired;
  }

  return null;
}

export type MeusDadosOriginalValues = {
  nome: string;
  telefoneDigits: string;
  complemento: string;
  foto: string;
};

export function buildOriginalValues(user: User): MeusDadosOriginalValues {
  return {
    nome: user.nome ?? '',
    telefoneDigits: getOriginalPhoneDigits(user),
    complemento: user.complemento ?? '',
    foto: user.foto ?? '',
  };
}

export function detectMeusDadosChanges(params: {
  nome: string;
  telefoneDigits: string;
  complemento: string;
  originals: MeusDadosOriginalValues;
}): {
  nomeAlterado: boolean;
  telefoneAlterado: boolean;
  complementoAlterado: boolean;
  hasChanges: boolean;
} {
  const nomeAlterado =
    normalizePersonName(params.nome) !== normalizePersonName(params.originals.nome);
  const telefoneAlterado = params.telefoneDigits !== params.originals.telefoneDigits;
  const complementoAlterado = params.complemento.trim() !== params.originals.complemento.trim();

  return {
    nomeAlterado,
    telefoneAlterado,
    complementoAlterado,
    hasChanges: nomeAlterado || telefoneAlterado || complementoAlterado,
  };
}
