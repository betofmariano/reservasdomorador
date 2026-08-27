import type { GestorMoradorItem } from '@/types/usuario';
import {
  normalizeBoolean,
  normalizeRecordId,
  readEndereco,
  readString,
  unwrapApiList,
} from '@/utils/normalize-api-fields';
import { formatBrazilianMobilePhone, stripPhoneDigits } from '@/utils/phone-mask';
import { readPhotoUrlFromUnknown } from '@/utils/user-photo';

function nestedUsers(record: Record<string, unknown>): Record<string, unknown> | null {
  if (record._users && typeof record._users === 'object' && !Array.isArray(record._users)) {
    return record._users as Record<string, unknown>;
  }

  if (record.users && typeof record.users === 'object' && !Array.isArray(record.users)) {
    return record.users as Record<string, unknown>;
  }

  return null;
}

function looksLikePhotoValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();

  return (
    trimmed.startsWith('http') ||
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('//') ||
    trimmed.includes('/vault/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/.test(trimmed)
  );
}

function readPersonNameValue(record: Record<string, unknown> | null): string {
  if (!record) {
    return '';
  }

  const nome = readString(record, ['nome', 'nome_usuario']).trim();

  if (!nome || looksLikePhotoValue(nome)) {
    return '';
  }

  return nome;
}

function readTelefoneLimpo(record: Record<string, unknown>, nestedUser: Record<string, unknown> | null): string {
  const raw =
    record.telefoneLimpo ??
    record.telefone_limpo ??
    record.telefone ??
    nestedUser?.telefoneLimpo ??
    nestedUser?.telefone;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return stripPhoneDigits(String(raw));
  }

  if (typeof raw === 'string') {
    return stripPhoneDigits(raw);
  }

  return '';
}

function readFoto(record: Record<string, unknown>, nestedUser: Record<string, unknown> | null): string | null {
  return (
    (nestedUser ? readPhotoUrlFromUnknown(nestedUser.Foto ?? nestedUser.foto) : null) ??
    readPhotoUrlFromUnknown(record.foto) ??
    readPhotoUrlFromUnknown(record.Foto)
  );
}

export function normalizeGestorMoradorFromApi(raw: unknown): GestorMoradorItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const userslocalId = normalizeRecordId(record.id ?? record.userslocal_id);
  const usersId = normalizeRecordId(record.users_id ?? record.usersId);

  if (userslocalId == null || userslocalId <= 0 || usersId == null || usersId <= 0) {
    return null;
  }

  const nestedUser = nestedUsers(record);
  const nome = readPersonNameValue(nestedUser) || readPersonNameValue(record);
  const telefoneLimpo = readTelefoneLimpo(record, nestedUser);
  const endereco = readEndereco(record, nestedUser);

  return {
    userslocalId,
    usersId,
    nome: nome || 'Sem nome',
    telefone: formatBrazilianMobilePhone(telefoneLimpo),
    telefoneLimpo,
    endereco,
    foto: readFoto(record, nestedUser),
    aprovado: normalizeBoolean(record.aprovado),
    bloqueado: normalizeBoolean(record.bloqueado),
  };
}

export function normalizeGestorMoradoresFromApi(raw: unknown): GestorMoradorItem[] {
  const items = unwrapGestorMoradoresPayload(raw);

  return items
    .map((item) => normalizeGestorMoradorFromApi(item))
    .filter((item): item is GestorMoradorItem => item !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

function unwrapGestorMoradoresPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  const unwrapped = unwrapApiList(raw);

  if (unwrapped.length > 0) {
    return unwrapped;
  }

  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;

    if (normalizeRecordId(record.id) != null && normalizeRecordId(record.users_id ?? record.usersId) != null) {
      return [record];
    }
  }

  return [];
}

export function readBackendMensagem(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;

  for (const key of ['mensagem', 'message'] as const) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}
