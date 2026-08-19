import { ASSOCIACAO_LOCAL_LABELS } from '@/constants/associacao-local-labels';
import { isValidNumericPassword } from '@/constants/auth';
import { appAlert, appConfirm } from '@/utils/app-dialog-bridge';
import { validatePersonName } from '@/utils/meus-dados';
import { BRAZILIAN_MOBILE_PHONE_DIGITS, stripPhoneDigits } from '@/utils/phone-mask';

export const PHONE_VALIDATION_MESSAGES = {
  telefoneInvalid:
    'Informe um telefone válido com DDD e 9 dígitos (ex.: (11) 98765-4321).',
  mobileNineRequired:
    'O terceiro dígito deve ser 9 para celular com DDD. Verifique o número informado.',
  mobileNineTitle: 'Número inválido',
  brazilDdiConfirmTitle: 'Confirmar telefone',
  brazilDdiConfirmMessage:
    'Os dois primeiros dígitos são 55 (DDI do Brasil). Confirma que este número está correto?',
};

export function getPhoneDigits(value: string): string {
  return stripPhoneDigits(value);
}

export function isCompleteBrazilianMobilePhone(value: string): boolean {
  return getPhoneDigits(value).length === BRAZILIAN_MOBILE_PHONE_DIGITS;
}

export function phoneDigitsStartWithBrazilDdi(digits: string): boolean {
  return digits.length >= 2 && digits.startsWith('55');
}

export function phoneThirdDigitIsNotMobileNine(digits: string): boolean {
  if (phoneDigitsStartWithBrazilDdi(digits)) {
    return false;
  }

  return digits.length >= 3 && digits[2] !== '9';
}

function showBlockingAlert(title: string, message: string): Promise<boolean> {
  return appAlert({ title, message }).then(() => false);
}

export function confirmPhoneWithBrazilDdiPrefix(digits: string): Promise<boolean> {
  if (!phoneDigitsStartWithBrazilDdi(digits)) {
    return Promise.resolve(true);
  }

  return appConfirm({
    title: PHONE_VALIDATION_MESSAGES.brazilDdiConfirmTitle,
    message: PHONE_VALIDATION_MESSAGES.brazilDdiConfirmMessage,
    cancelLabel: 'Não',
    confirmLabel: 'Sim, confirmar',
  });
}

export async function confirmPhoneSubmitChecks(phone: string): Promise<boolean> {
  const digits = getPhoneDigits(phone);

  if (phoneDigitsStartWithBrazilDdi(digits)) {
    const confirmed = await confirmPhoneWithBrazilDdiPrefix(digits);

    if (!confirmed) {
      return false;
    }
  }

  if (phoneThirdDigitIsNotMobileNine(digits)) {
    return showBlockingAlert(
      PHONE_VALIDATION_MESSAGES.mobileNineTitle,
      PHONE_VALIDATION_MESSAGES.mobileNineRequired,
    );
  }

  return true;
}

export function alertMatriculaRequired(): void {
  void appAlert({
    title: SIGNUP_VALIDATION_MESSAGES.matriculaRequiredTitle,
    message: SIGNUP_VALIDATION_MESSAGES.matriculaRequiredMessage,
  });
}

export function alertComplementoRequired(): void {
  void appAlert({
    title: SIGNUP_VALIDATION_MESSAGES.complementoRequiredTitle,
    message: SIGNUP_VALIDATION_MESSAGES.complementoRequiredMessage,
  });
}

export const SIGNUP_VALIDATION_MESSAGES = {
  telefoneRequired: 'Informe seu telefone/WhatsApp.',
  passwordInvalid: 'A senha deve ter de 4 a 6 dígitos numéricos.',
  passwordMismatch: 'As senhas não coincidem.',
  associacaoLocalRequired: ASSOCIACAO_LOCAL_LABELS.obrigatorio,
  matriculaRequired: 'Informe o número da matrícula.',
  matriculaRequiredTitle: 'Matrícula obrigatória',
  matriculaRequiredMessage: ASSOCIACAO_LOCAL_LABELS.matriculaExigida,
  complementoRequired: ASSOCIACAO_LOCAL_LABELS.complementoObrigatorio,
  complementoRequiredTitle: ASSOCIACAO_LOCAL_LABELS.complementoObrigatorioTitulo,
  complementoRequiredMessage: ASSOCIACAO_LOCAL_LABELS.complementoObrigatorioMensagem,
  photoRequired: 'Selecione ou tire uma foto para continuar.',
};

export const LOGIN_VALIDATION_MESSAGES = {
  telefoneRequired: 'Informe seu telefone/WhatsApp.',
  passwordRequired: 'Informe sua senha.',
  passwordInvalid: 'A senha deve ter de 4 a 6 dígitos numéricos.',
};

export type SignupValidationParams = {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  academiasId: number | null;
  hasPhoto: boolean;
  requiresMatricula?: boolean;
  matricula?: string;
  requiresComplemento?: boolean;
  complemento?: string;
};

export function getSignupValidationError(params: SignupValidationParams): string | null {
  const nameError = validatePersonName(params.name);

  if (nameError) {
    return nameError;
  }

  if (!params.phone.trim()) {
    return SIGNUP_VALIDATION_MESSAGES.telefoneRequired;
  }

  const phoneError = validatePhoneDigits(params.phone);

  if (phoneError) {
    return phoneError;
  }

  if (!isValidNumericPassword(params.password)) {
    return SIGNUP_VALIDATION_MESSAGES.passwordInvalid;
  }

  if (params.password !== params.confirmPassword) {
    return SIGNUP_VALIDATION_MESSAGES.passwordMismatch;
  }

  if (!params.academiasId) {
    return SIGNUP_VALIDATION_MESSAGES.associacaoLocalRequired;
  }

  if (params.requiresMatricula && !params.matricula?.trim()) {
    return SIGNUP_VALIDATION_MESSAGES.matriculaRequired;
  }

  if (params.requiresComplemento && !params.complemento?.trim()) {
    return SIGNUP_VALIDATION_MESSAGES.complementoRequired;
  }

  if (!params.hasPhoto) {
    return SIGNUP_VALIDATION_MESSAGES.photoRequired;
  }

  return null;
}

export function isSignupFormSubmittable(params: SignupValidationParams): boolean {
  return getSignupValidationError(params) === null;
}

export function getLoginValidationError(phone: string, password: string): string | null {
  if (!phone.trim()) {
    return LOGIN_VALIDATION_MESSAGES.telefoneRequired;
  }

  const phoneError = validatePhoneDigits(phone);

  if (phoneError) {
    return phoneError;
  }

  if (!password.trim()) {
    return LOGIN_VALIDATION_MESSAGES.passwordRequired;
  }

  if (!isValidNumericPassword(password)) {
    return LOGIN_VALIDATION_MESSAGES.passwordInvalid;
  }

  return null;
}

export function isLoginFormSubmittable(phone: string, password: string): boolean {
  return getLoginValidationError(phone, password) === null;
}

export function validatePhoneDigits(value: string): string | null {
  const digits = getPhoneDigits(value);

  if (phoneThirdDigitIsNotMobileNine(digits)) {
    return PHONE_VALIDATION_MESSAGES.mobileNineRequired;
  }

  if (!isCompleteBrazilianMobilePhone(value)) {
    return PHONE_VALIDATION_MESSAGES.telefoneInvalid;
  }

  return null;
}
