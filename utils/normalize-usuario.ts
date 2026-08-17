import { stripNonNumeric } from '@/constants/auth';
import type { UsersLocalApiRecord, UsuarioListItem } from '@/types/usuario';
import {
  normalizeUserLocalFromApi,
} from '@/utils/normalize-user-local';
import {
  readPersonPhoto,
  readString,
  readUserId,
} from '@/utils/normalize-api-fields';
import { stripPhoneDigits } from '@/utils/phone-mask';

function readUsersLocalTelefoneLimpo(record: Record<string, unknown>): string {
  const nestedUser =
    record._users && typeof record._users === 'object'
      ? (record._users as Record<string, unknown>)
      : null;

  const rawValue =
    readString(record, ['telefoneLimpo']) ||
    (nestedUser ? readString(nestedUser, ['telefoneLimpo', 'telefoneConfirmado']) : '');

  return stripPhoneDigits(rawValue);
}

export function normalizeUsersLocalApiRecord(raw: unknown): UsersLocalApiRecord | null {
  const association = normalizeUserLocalFromApi(raw);

  if (!association) {
    return null;
  }

  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const nestedUser =
    record._users && typeof record._users === 'object'
      ? (record._users as Record<string, unknown>)
      : null;
  const telefoneLimpo = readUsersLocalTelefoneLimpo(record);
  const complemento =
    association.complemento.trim() ||
    readString(record, ['complemento']) ||
    (nestedUser ? readString(nestedUser, ['complemento']) : '');

  return {
    id: association.id,
    nome: association.nome,
    users_id: association.users_id,
    academias_id: association.academias_id,
    aprovado: association.aprovado,
    bloqueado: association.bloqueado,
    gestor: association.gestor,
    professor: association.professor,
    administrador: association.administrador,
    ultimoAcesso: association.ultimoAcesso,
    telefoneLimpo: telefoneLimpo || null,
    socioTitulo:
      association.socioTitulo.trim() ||
      readString(record, ['socioTitulo', 'matricula']) ||
      null,
    complemento: complemento || null,
    _users: nestedUser
      ? {
          Foto: readString(nestedUser, ['Foto', 'foto']) || null,
          foto: readPersonPhoto(nestedUser) || null,
          telefoneConfirmado:
            readString(nestedUser, ['telefoneConfirmado']) || telefoneLimpo || null,
          telefoneLimpo: readString(nestedUser, ['telefoneLimpo']) || telefoneLimpo || null,
          email: readString(nestedUser, ['email']) || null,
          matricula: readString(nestedUser, ['matricula', 'socioTitulo']) || null,
          complemento: complemento || null,
          gestor: association.gestor,
          professor: association.professor,
          administrador: association.administrador,
          bloqueado: association.bloqueado,
        }
      : null,
  };
}

export function normalizeUsersLocalApiRecords(raw: unknown): UsersLocalApiRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeUsersLocalApiRecord(item))
    .filter((item): item is UsersLocalApiRecord => item !== null);
}

export function isUsersLocalAdministrador(record: UsersLocalApiRecord): boolean {
  return record.administrador === true || record._users?.administrador === true;
}

export function mapUsersLocalToAcademiaList(
  records: UsersLocalApiRecord[],
  academiasId: number,
): UsuarioListItem[] {
  const seenUserIds = new Set<number>();

  const users = records
    .filter((record) => record.academias_id === academiasId)
    .filter((record) => !isUsersLocalAdministrador(record))
    .reduce<UsuarioListItem[]>((accumulator, record) => {
      const userId = readUserId(record) ?? record.users_id;

      if (seenUserIds.has(userId)) {
        return accumulator;
      }

      seenUserIds.add(userId);

      accumulator.push({
        id: userId,
        userslocalId: record.id,
        nome: record.nome.trim(),
        foto: null,
        telefoneLimpo: stripPhoneDigits(record.telefoneLimpo ?? ''),
      });

      return accumulator;
    }, []);

  return users.sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
  );
}

/** @deprecated Use mapUsersLocalToAcademiaList */
export const mapUsersLocalToClubList = mapUsersLocalToAcademiaList;
