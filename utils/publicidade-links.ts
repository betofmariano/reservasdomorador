import { Linking, Platform } from 'react-native';

const LINK_OPEN_ERROR_MESSAGE = 'Não foi possível abrir este link.';

export function normalizeMediaUrl(value: string | null | undefined): string | null {
  if (!value || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed.replace(/^\/+/, '')}`;
}

export function normalizeExternalUrl(value: string | null | undefined): string | null {
  return normalizeMediaUrl(value);
}

export function buildWhatsAppUrl(telefone: string | null | undefined): string | null {
  if (!telefone?.trim()) {
    return null;
  }

  const trimmed = telefone.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  const normalized = digits.startsWith('55') ? digits : `55${digits}`;

  return `https://wa.me/${normalized}`;
}

export function buildInstagramUrl(instagram: string | null | undefined): string | null {
  if (!instagram?.trim()) {
    return null;
  }

  const trimmed = instagram.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.includes('instagram.com')) {
    return normalizeExternalUrl(trimmed);
  }

  const handle = trimmed.replace(/^@+/, '').replace(/^\/+/, '');

  if (!handle) {
    return null;
  }

  return `https://instagram.com/${handle}`;
}

export async function openExternalLink(url: string): Promise<string | null> {
  try {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      return LINK_OPEN_ERROR_MESSAGE;
    }

    await Linking.openURL(url);
    return null;
  } catch {
    return LINK_OPEN_ERROR_MESSAGE;
  }
}

export function shouldOpenLinkInNewTab(): boolean {
  return Platform.OS === 'web';
}
