import { normalizePhoneForApi } from '@/constants/auth';
import type { User } from '@/types/user';
import {
  normalizeBoolean,
  normalizeRecordId,
  readAcademiaId,
  readPersonName,
  readEndereco,
  readString,
  readUserId,
} from '@/utils/normalize-api-fields';
import { resolvePersonPhotoFromApiPayload } from '@/utils/user-photo';
import { resolveEffectiveLocalRoles } from '@/utils/user-local-roles';

const NESTED_USER_KEYS = [
  'user',
  'users',
  '_users',
  'usersxano',
  '_usersxano',
  'userEncontrado',
] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function omitPassword(
  record: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!record) {
    return {};
  }

  const next = { ...record };
  delete next.password;
  return next;
}

/**
 * Combina GET /auth/me: `user` (tabela users) + `vinculo` (userslocal).
 * `User.id` vem só de `user.id`. `vinculo.id` vai para `userslocalId`.
 */
function mergeAuthMeUserAndVinculo(raw: Record<string, unknown>): Record<string, unknown> {
  const vinculo = isPlainRecord(raw.vinculo)
    ? raw.vinculo
    : isPlainRecord(raw.userEncontrado)
      ? raw.userEncontrado
      : null;
  const nestedFromVinculo = vinculo
    ? NESTED_USER_KEYS.map((key) => vinculo[key]).find(isPlainRecord) ?? null
    : null;
  const userRecord = isPlainRecord(raw.user) ? raw.user : nestedFromVinculo;

  if (!userRecord && !vinculo) {
    return raw;
  }

  const userId = userRecord ? normalizeRecordId(userRecord.id) : null;
  const vinculoId = vinculo ? normalizeRecordId(vinculo.id) : null;
  const condominioId = vinculo
    ? normalizeRecordId(vinculo.condominio_id ?? vinculo.academias_id)
    : null;

  const userWithoutPassword = omitPassword(userRecord);
  const vinculoWithoutId = omitPassword(vinculo);
  if (vinculoWithoutId) {
    delete vinculoWithoutId.id;
  }

  return {
    ...raw,
    ...vinculoWithoutId,
    ...userWithoutPassword,
    id: userId ?? vinculoWithoutId.users_id ?? userWithoutPassword.id,
    users_id: userId ?? vinculoWithoutId.users_id,
    academias_id: condominioId ?? userWithoutPassword.academias_id,
    condominio_id: condominioId,
    localPrioritario: condominioId,
    userslocalId: vinculoId,
    nome: userWithoutPassword.nome ?? vinculoWithoutId.nome,
    telefone: userWithoutPassword.telefone ?? userWithoutPassword.telefoneLimpo,
    telefoneLimpo: userWithoutPassword.telefoneLimpo ?? userWithoutPassword.telefone,
    Foto: userWithoutPassword.Foto ?? userWithoutPassword.foto,
    administrador: vinculoWithoutId.administrador,
    gestor: vinculoWithoutId.gestor,
    professor: vinculoWithoutId.professor,
    aprovado: vinculoWithoutId.aprovado,
    bloqueado: vinculoWithoutId.bloqueado,
    excluido: vinculoWithoutId.excluido ?? userWithoutPassword.excluido,
    endereco: readEndereco(vinculoWithoutId, userWithoutPassword),
  };
}

function mergeUsersLocalFields(record: Record<string, unknown>): Record<string, unknown> {
  const usersLocal = record.usersLocal ?? record.userslocal;

  if (!usersLocal || typeof usersLocal !== 'object') {
    return record;
  }

  const localRecord = usersLocal as Record<string, unknown>;
  const effectiveRoles = resolveEffectiveLocalRoles({
    gestor: normalizeBoolean(localRecord.gestor),
    professor: normalizeBoolean(localRecord.professor),
  });

  return {
    ...record,
    users_id: record.users_id ?? localRecord.users_id ?? localRecord.users_id,
    telefone:
      readString(record, ['telefone', 'telefoneConfirmado']) ||
      readString(localRecord, ['telefone', 'telefoneConfirmado']),
    telefoneLimpo:
      readString(record, ['telefoneLimpo']) ||
      readString(localRecord, ['telefoneLimpo', 'telefoneConfirmado', 'telefone']),
    academias_id: record.academias_id ?? localRecord.academias_id ?? localRecord.condominio_id,
    endereco: readEndereco(record, localRecord),
    administrador: record.administrador ?? localRecord.administrador,
    gestor: record.gestor ?? effectiveRoles.gestor,
    professor: record.professor ?? effectiveRoles.professor,
    aprovado: record.aprovado ?? localRecord.aprovado,
    bloqueado: record.bloqueado ?? localRecord.bloqueado,
    matricula: record.matricula ?? localRecord.socioTitulo ?? record.socioTitulo,
    cienteCancelamento:
      record.cienteCancelamento ?? localRecord.cienteCancelamento,
  };
}

function mergeNestedUserFields(record: Record<string, unknown>): Record<string, unknown> {
  let merged = { ...record };

  for (const nestedKey of NESTED_USER_KEYS) {
    const nested = record[nestedKey];

    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      continue;
    }

    const nestedRecord = nested as Record<string, unknown>;

    merged = {
      ...merged,
      id: merged.id ?? nestedRecord.id,
      nome: merged.nome ?? nestedRecord.nome ?? nestedRecord.nome_usuario,
      email: merged.email ?? nestedRecord.email,
      telefone: merged.telefone ?? nestedRecord.telefone ?? nestedRecord.telefoneLimpo,
      telefoneLimpo: merged.telefoneLimpo ?? nestedRecord.telefoneLimpo ?? nestedRecord.telefone,
      academias_id: merged.academias_id ?? nestedRecord.academias_id ?? nestedRecord.condominio_id,
      administrador: merged.administrador ?? nestedRecord.administrador,
      gestor: merged.gestor ?? nestedRecord.gestor,
      professor: merged.professor ?? nestedRecord.professor,
      aprovado: merged.aprovado ?? nestedRecord.aprovado,
      bloqueado: merged.bloqueado ?? nestedRecord.bloqueado,
      matricula: merged.matricula ?? nestedRecord.matricula ?? nestedRecord.socioTitulo,
      endereco: readEndereco(merged, nestedRecord),
      ultimaPublicidadeData:
        merged.ultimaPublicidadeData ?? nestedRecord.ultimaPublicidadeData,
    };
  }

  return mergeUsersLocalFields(merged);
}

function readUserTelefoneLimpo(record: Record<string, unknown>): string {
  const direct = readString(record, ['telefoneLimpo']);

  if (direct) {
    return normalizePhoneForApi(direct);
  }

  for (const key of NESTED_USER_KEYS) {
    const nested = record[key];

    if (!nested || typeof nested !== 'object') {
      continue;
    }

    const nestedRecord = nested as Record<string, unknown>;
    const fromNested = readString(nestedRecord, [
      'telefoneLimpo',
      'telefoneConfirmado',
      'telefone',
    ]);

    if (fromNested) {
      return normalizePhoneForApi(fromNested);
    }
  }

  const telefone = readString(record, ['telefone', 'telefoneConfirmado']);

  return normalizePhoneForApi(telefone);
}

export function normalizeUserFromApi(raw: unknown): User {
  const incoming =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const hasAuthMeShape =
    isPlainRecord(incoming.user) ||
    isPlainRecord(incoming.vinculo) ||
    isPlainRecord(incoming.userEncontrado);
  const baseRecord = hasAuthMeShape ? mergeAuthMeUserAndVinculo(incoming) : incoming;
  const record = mergeNestedUserFields(baseRecord);

  const telefone = readString(record, ['telefone', 'telefoneConfirmado', 'telefoneLimpo']);
  const telefoneLimpo = readUserTelefoneLimpo(record);
  const nestedUsers =
    record._users && typeof record._users === 'object'
      ? (record._users as Record<string, unknown>)
      : isPlainRecord(record.user)
        ? record.user
        : null;
  const photoSource = isPlainRecord(incoming.user)
    ? incoming.user
    : isPlainRecord(incoming.userEncontrado)
      ? incoming.userEncontrado
      : baseRecord;
  const userId = hasAuthMeShape
    ? normalizeRecordId(
        isPlainRecord(incoming.user)
          ? incoming.user.id
          : record.id ?? record.users_id,
      )
    : (readUserId(record) ?? normalizeRecordId(record.id));

  return {
    id: userId ?? 0,
    nome: readPersonName(record),
    email: readString(record, ['email']) || (nestedUsers ? readString(nestedUsers, ['email']) : ''),
    academias_id: readAcademiaId(record) ?? 0,
    userslocalId: normalizeRecordId(record.userslocalId) ?? null,
    telefone: telefone || telefoneLimpo,
    telefoneLimpo,
    telefoneCorrigido: readString(record, ['novoTelefone', 'telefoneCorrigido']),
    telefoneConfirmado: telefoneLimpo,
    foto: resolvePersonPhotoFromApiPayload(photoSource),
    administrador: normalizeBoolean(record.administrador),
    gestor: normalizeBoolean(record.gestor),
    professor: normalizeBoolean(record.professor),
    aprovado: normalizeBoolean(record.aprovado),
    bloqueado: normalizeBoolean(record.bloqueado),
    cienteCancelamento: normalizeBoolean(record.cienteCancelamento),
    matricula: readString(record, ['matricula', 'socioTitulo']),
    endereco: readEndereco(record, nestedUsers),
    ultimaPublicidadeData:
      typeof record.ultimaPublicidadeData === 'number'
        ? record.ultimaPublicidadeData
        : null,
    excluido: normalizeBoolean(record.excluido),
    localPrioritario: normalizeRecordId(
      record.localPrioritario ?? record.local_prioritario ?? record.condominio_id,
    ),
    telefoneIncorreto: normalizeBoolean(record.telefoneIncorreto ?? record.telefone_incorreto),
    fotoUpload: record.fotoUpload ?? record.foto_upload ?? null,
  };
}
