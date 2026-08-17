import { buildUsersBloqueadosCreatePath, buildUsersBloqueadosDeletePath, buildUsersBloqueadosListPath } from '@/constants/api';
import { authDeleteRequest, authGetRequest, authPostRequest } from '@/services/api-client';
import type { CreateUsersBloqueadosPayload, UsersBloqueadoRegistro } from '@/types/users-bloqueados';
import { normalizeUsersBloqueadosListFromApi } from '@/utils/normalize-users-bloqueados';

export async function getUsersBloqueadosByAcademia(
  academiasId: number,
  authToken: string,
): Promise<UsersBloqueadoRegistro[]> {
  const data = await authGetRequest<unknown>(
    buildUsersBloqueadosListPath(academiasId),
    authToken,
  );

  return normalizeUsersBloqueadosListFromApi(data);
}

export async function createUsersBloqueadosRecord(
  payload: CreateUsersBloqueadosPayload,
  authToken: string,
): Promise<UsersBloqueadoRegistro | null> {
  const data = await authPostRequest<unknown>(
    buildUsersBloqueadosCreatePath(),
    authToken,
    payload,
  );

  if (!data || typeof data !== 'object') {
    return null;
  }

  const list = normalizeUsersBloqueadosListFromApi([data]);
  return list[0] ?? null;
}

export async function deleteUsersBloqueadosRecord(
  usersBloqueadosId: number,
  authToken: string,
): Promise<void> {
  await authDeleteRequest(buildUsersBloqueadosDeletePath(usersBloqueadosId), authToken);
}
