import {
  buildUsersLocalAprovarPath,
  buildUsersLocalBloqueioPath,
  buildUsersLocalDeletePath,
  buildUsersLocalGestorPath,
  buildUsersLocalProfessorPath,
  buildUsersLocalItemPath,
  buildUsersItemPath,
} from '@/constants/api';
import { ApiError, authDeleteRequest, authPatchRequest } from '@/services/api-client';
import { createUsersBloqueadosRecord } from '@/services/users-bloqueados-service';
import { buildCreateUsersBloqueadosPayload } from '@/utils/users-bloqueados';
import type {
  UpdateUsersLocalPayload,
  UpdateUsersPayload,
  UsersLocalApiRecord,
  UsersApiRecord,
} from '@/types/usuario';

export async function updateUsersLocalRecord(
  userslocalId: number,
  payload: UpdateUsersLocalPayload,
  authToken: string,
): Promise<UsersLocalApiRecord> {
  return authPatchRequest<UsersLocalApiRecord>(
    buildUsersLocalItemPath(userslocalId),
    authToken,
    payload,
  );
}

export async function updateUsersRecord(
  usersId: number,
  payload: UpdateUsersPayload,
  authToken: string,
): Promise<UsersApiRecord> {
  return authPatchRequest<UsersApiRecord>(
    buildUsersItemPath(usersId),
    authToken,
    payload,
  );
}

export async function approveUsuarioRecords(
  userslocalId: number,
  authToken: string,
): Promise<UsersLocalApiRecord | null> {
  return authPatchRequest<UsersLocalApiRecord | null>(
    buildUsersLocalAprovarPath(userslocalId),
    authToken,
    {},
  );
}

export async function setUsersLocalBlocked(
  userslocalId: number,
  bloqueado: boolean,
  authToken: string,
): Promise<UsersLocalApiRecord | null> {
  return authPatchRequest<UsersLocalApiRecord | null>(
    buildUsersLocalBloqueioPath(userslocalId, bloqueado),
    authToken,
    {
      userslocal_id: userslocalId,
      bloqueado,
    },
  );
}

export async function suspendUsuarioAtividadeRecords(
  userslocalId: number,
  usersId: number,
  atividadesId: number,
  dias: number,
  authToken: string,
): Promise<unknown> {
  return createUsersBloqueadosRecord(
    buildCreateUsersBloqueadosPayload({
      userslocalId,
      usersId,
      atividadesId,
      dias,
    }),
    authToken,
  );
}

export async function setGestorUsuarioRecords(
  userslocalId: number,
  gestor: boolean,
  authToken: string,
): Promise<UsersLocalApiRecord | null> {
  return authPatchRequest<UsersLocalApiRecord | null>(
    buildUsersLocalGestorPath(userslocalId, gestor),
    authToken,
    {},
  );
}

export async function setProfessorUsuarioRecords(
  userslocalId: number,
  professor: boolean,
  authToken: string,
): Promise<UsersLocalApiRecord | null> {
  return authPatchRequest<UsersLocalApiRecord | null>(
    buildUsersLocalProfessorPath(userslocalId, professor),
    authToken,
    {},
  );
}

function isUsersLocalDeletePostProcessingError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // Xano deletes userslocal but then references usersLocal1 in a later stack step.
  return error.message.includes('Missing var entry: usersLocal1');
}

export async function deleteUsersLocalRecord(
  userslocalId: number,
  authToken: string,
): Promise<unknown> {
  try {
    return await authDeleteRequest<unknown>(buildUsersLocalDeletePath(userslocalId), authToken);
  } catch (error) {
    if (isUsersLocalDeletePostProcessingError(error)) {
      return null;
    }

    throw error;
  }
}
