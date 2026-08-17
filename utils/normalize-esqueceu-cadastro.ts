import { normalizePhoneForApi } from '@/constants/auth';
import type { EsqueceuCadastroUsuarioMatch } from '@/types/account-recovery';
import {
  normalizeRecordId,
  readAcademiaId,
  readPersonName,
  readString,
  readUserId,
} from '@/utils/normalize-api-fields';
import { stripPhoneDigits } from '@/utils/phone-mask';

const USUARIOS_KEYS = [
  'usuarios',
  'usuariosEncontrados',
  'cadastros',
  'registros',
  'users',
  'items',
  'data',
  'records',
] as const;

function normalizeUsuarioMatch(record: unknown): EsqueceuCadastroUsuarioMatch | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const item = record as Record<string, unknown>;
  const nestedAcademia = item.academia ?? item.academias ?? item._academias;
  const academiaRecord =
    nestedAcademia && typeof nestedAcademia === 'object' && !Array.isArray(nestedAcademia)
      ? (nestedAcademia as Record<string, unknown>)
      : null;

  const nome = readPersonName(item);
  const telefoneLimpo =
    readString(item, ['telefoneLimpo', 'telefoneConfirmado', 'telefone']) ||
    normalizePhoneForApi(readString(item, ['fone', 'phone']));

  if (!nome.trim()) {
    return null;
  }

  const usersId = readUserId(item);
  const academiasId =
    readAcademiaId(item) ??
    normalizeRecordId(item.local) ??
    (academiaRecord ? normalizeRecordId(academiaRecord.id) : null) ??
    normalizeRecordId(item.academias_id);

  const associacaoNome =
    readString(item, ['associacaoNome', 'academiaNome', 'localNome', 'local_nome']) ||
    readString(academiaRecord ?? {}, ['nome', 'nomeAcademia']) ||
    undefined;

  return {
    usersId,
    nome: nome.trim(),
    telefoneLimpo: stripPhoneDigits(telefoneLimpo) || undefined,
    academiasId,
    associacaoNome,
  };
}

function extractUsuariosArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;

  for (const key of USUARIOS_KEYS) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  const totalEncontrado = record.totalEncontrado ?? record.TotalEncontrado;

  if (typeof totalEncontrado === 'number' && totalEncontrado === 1) {
    const single = normalizeUsuarioMatch(record);

    return single ? [single] : [];
  }

  return [];
}

export function normalizeEsqueceuCadastroUsuarios(payload: unknown): EsqueceuCadastroUsuarioMatch[] {
  const seen = new Set<string>();

  return extractUsuariosArray(payload)
    .map((item) => normalizeUsuarioMatch(item))
    .filter((item): item is EsqueceuCadastroUsuarioMatch => {
      if (!item) {
        return false;
      }

      const key = `${item.usersId ?? 'x'}:${item.nome}:${item.academiasId ?? 'x'}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}
