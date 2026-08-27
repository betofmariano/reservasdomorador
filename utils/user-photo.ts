import type { UpdatePhotoResponse } from '@/types/user-photo';

export function hasUserPhoto(foto: string | null | undefined): boolean {
  return typeof foto === 'string' && foto.trim().length > 0;
}

export function normalizePhotoUrl(foto: string | null | undefined): string | null {
  if (!hasUserPhoto(foto)) {
    return null;
  }

  const trimmed = foto!.trim();

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || trimmed.startsWith('http')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
}

/** Lê o campo texto `Foto` da tabela users. */
export function readUsersTableFotoText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidates: unknown[] = [payload];
  const record = payload as Record<string, unknown>;

  for (const key of ['user', 'users', 'item']) {
    const nested = record[key];

    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      candidates.push(nested);
    }
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      continue;
    }

    const value = (candidate as Record<string, unknown>).Foto;

    if (typeof value === 'string' && value.trim()) {
      return normalizePhotoUrl(value);
    }
  }

  return null;
}

export function readPhotoUrlFromUnknown(value: unknown): string | null {
  if (typeof value === 'string') {
    return normalizePhotoUrl(value);
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of ['url', 'path']) {
    const candidate = record[key];

    if (typeof candidate === 'string') {
      const normalized = normalizePhotoUrl(candidate);

      if (normalized) {
        return normalized;
      }
    }
  }

  if (record.meta && typeof record.meta === 'object') {
    const metaUrl = readPhotoUrlFromUnknown((record.meta as Record<string, unknown>).url);

    if (metaUrl) {
      return metaUrl;
    }
  }

  return null;
}

export function readPersonPhotoFromRecord(record: Record<string, unknown>): string {
  for (const key of ['Foto', 'foto', 'fotoUpload', 'https']) {
    const url = readPhotoUrlFromUnknown(record[key]);

    if (url) {
      return url;
    }
  }

  return '';
}

export function extractPhotoUrlFromApiPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const directPhoto = readPersonPhotoFromRecord(record);

  if (directPhoto) {
    return directPhoto;
  }

  for (const key of ['user', 'users', 'users2', 'usersLocal', 'userslocal', '_users', 'UserSelecionado']) {
    const nested = record[key];

    if (nested && typeof nested === 'object') {
      const nestedPhoto = readPersonPhotoFromRecord(nested as Record<string, unknown>);

      if (nestedPhoto) {
        return nestedPhoto;
      }
    }
  }

  return null;
}

export function resolvePersonPhotoFromApiPayload(raw: unknown): string {
  return extractPhotoUrlFromApiPayload(raw) ?? '';
}

export function resolveUpdatedPhotoUrl(
  response: UpdatePhotoResponse | null | undefined,
  fallbackUri?: string | null,
): string | null {
  if (response && typeof response === 'object') {
    const directPhoto = normalizePhotoUrl(response.foto);

    if (directPhoto) {
      return directPhoto;
    }

    const userPhoto =
      response.user && typeof response.user === 'object'
        ? normalizePhotoUrl(response.user.foto)
        : null;

    if (userPhoto) {
      return userPhoto;
    }

    const extractedPhoto = extractPhotoUrlFromApiPayload(response);

    if (extractedPhoto) {
      return extractedPhoto;
    }
  }

  return normalizePhotoUrl(fallbackUri);
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function getFirstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts[0] ?? '';
}

export function getShortDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts.slice(0, 2).join(' ');
}

const PORTRAIT_PHOTO_SIZE_MULTIPLIER = 1.3;
const PORTRAIT_PHOTO_HEIGHT_RATIO = 1.25;

export function getPortraitPhotoDimensions(baseSize: number) {
  const width = Math.round(baseSize * PORTRAIT_PHOTO_SIZE_MULTIPLIER);
  const height = Math.round(width * PORTRAIT_PHOTO_HEIGHT_RATIO);
  const borderRadius = Math.min(12, width * 0.1);

  return { width, height, borderRadius };
}
