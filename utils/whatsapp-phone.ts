import { stripNonNumeric } from '@/constants/auth';

export function buildWhatsAppPhone(telefoneLimpo: string): string | null {
  const digits = stripNonNumeric(telefoneLimpo);

  if (!digits) {
    return null;
  }

  const normalized = digits.startsWith('55') ? digits : `55${digits}`;

  if (normalized.length < 12 || normalized.length > 13) {
    return null;
  }

  return normalized;
}

export function buildWhatsAppUrl(telefoneLimpo: string): string | null {
  const phone = buildWhatsAppPhone(telefoneLimpo);

  if (!phone) {
    return null;
  }

  return `https://wa.me/${phone}`;
}
