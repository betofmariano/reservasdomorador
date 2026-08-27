import { buildUsersBloqueadosCreatePath } from '@/constants/api';
import { authPostRequest } from '@/services/api-client';
import type { CreateUsersBloqueadosPayload, UsersBloqueadoRegistro } from '@/types/users-bloqueados';
import { normalizeUsersBloqueadosListFromApi } from '@/utils/normalize-users-bloqueados';

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
