export const BRAZILIAN_MOBILE_PHONE_MASK = '(00) 00000-0000';
export const BRAZILIAN_MOBILE_PHONE_MASK_LENGTH = 15;
export const BRAZILIAN_MOBILE_PHONE_DIGITS = 11;

export function stripPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 13 && digits.startsWith('55')) {
    return digits.slice(2, 13);
  }

  if (digits.length > BRAZILIAN_MOBILE_PHONE_DIGITS) {
    return digits.slice(-BRAZILIAN_MOBILE_PHONE_DIGITS);
  }

  return digits.slice(0, BRAZILIAN_MOBILE_PHONE_DIGITS);
}

export function formatBrazilianMobilePhone(value: string): string {
  const digits = stripPhoneDigits(value);

  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
