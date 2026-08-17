import { readPersonPhotoFromRecord } from '@/utils/user-photo';

export function normalizeRecordId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeBoolean(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'sim'
    );
  }

  return false;
}

/** Soft-delete / cancelamento de reserva — lê aliases comuns da API. */
export function readCanceladoFlag(
  ...records: Array<Record<string, unknown> | null | undefined>
): boolean {
  const keys = ['cancelado', 'Cancelado', 'cancelled', 'excluido', 'deleted'] as const;

  for (const record of records) {
    if (!record) {
      continue;
    }

    for (const key of keys) {
      if (normalizeBoolean(record[key])) {
        return true;
      }
    }
  }

  return false;
}

export function normalizeTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const asNumber = Number(trimmed);

    if (Number.isFinite(asNumber) && asNumber > 0) {
      return asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
    }

    const parsed = Date.parse(trimmed);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function readTimestamp(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const normalized = normalizeTimestamp(record[key]);

    if (normalized != null) {
      return normalized;
    }
  }

  return null;
}

export function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string') {
      return value;
    }
  }

  return '';
}

export function readBoolean(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    if (!(key in record)) {
      continue;
    }

    return normalizeBoolean(record[key]);
  }

  return undefined;
}

export function readPersonName(record: Record<string, unknown>): string {
  return readString(record, ['nome', 'nome_usuario']).trim();
}

export function readPersonPhoto(record: Record<string, unknown>): string {
  return readPersonPhotoFromRecord(record);
}

export function readAcademiaId(record: Record<string, unknown>): number | null {
  return normalizeRecordId(record.academias_id);
}

export function readUserId(record: Record<string, unknown>): number | null {
  return normalizeRecordId(record.users_id ?? record.id);
}
