import { API_ENDPOINTS, buildUsersItemPath } from '@/constants/api';
import { ApiError, authPatchRequest, authPostRequest } from '@/services/api-client';
import { updateUsersLocalRecord } from '@/services/usuario-gestor-service';

function shouldFallbackFromDedicatedEndpoint(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return true;
  }

  return error.status === 404 || error.status === 405 || error.status === 501;
}

export async function persistUserLocalPrioritario(input: {
  userId: number;
  academiasId: number;
  authToken: string;
  usersLocalId?: number | null;
}): Promise<void> {
  const { userId, academiasId, authToken, usersLocalId } = input;

  try {
    await authPostRequest(API_ENDPOINTS.usuarioLocalPrioritario, authToken, {
      academias_id: academiasId,
    });
  } catch (error) {
    if (!shouldFallbackFromDedicatedEndpoint(error)) {
      throw error;
    }

    await authPatchRequest(buildUsersItemPath(userId), authToken, {
      localPrioritario: academiasId,
    });
  }

  if (usersLocalId != null && usersLocalId > 0) {
    await updateUsersLocalRecord(
      usersLocalId,
      {
        ultimoAcesso: Date.now(),
      },
      authToken,
    );
  }
}
