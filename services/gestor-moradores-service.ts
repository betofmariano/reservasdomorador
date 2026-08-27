import { API_ENDPOINTS, buildUsersLocalListPath } from '@/constants/api';
import { authGetRequest, authPatchRequest } from '@/services/api-client';
import { deleteUsersLocalRecord, updateUsersLocalRecord } from '@/services/usuario-gestor-service';
import type { GestorUsuarioListItem } from '@/types/usuario';
import { unwrapApiList } from '@/utils/normalize-api-fields';
import { readBackendMensagem } from '@/utils/normalize-gestor-morador';
import { normalizeUsersLocalApiRecords } from '@/utils/normalize-usuario';
import { LISTA_USUARIOS_GESTOR_MESSAGES, mapUsersLocalToGestorList } from '@/utils/usuario-gestor-lista';

const APPROVE_SUCCESS_MESSAGE = 'Morador aprovado com sucesso.';
const BLOCK_SUCCESS_MESSAGE = 'Morador bloqueado com sucesso.';
const UNBLOCK_SUCCESS_MESSAGE = 'Morador desbloqueado com sucesso.';
const GESTOR_SUCCESS_MESSAGE = 'Usuário definido como gestor.';
const UNSET_GESTOR_SUCCESS_MESSAGE = 'Gestor removido com sucesso.';

export async function getGestorMoradores(
  academiasId: number,
  authToken: string,
): Promise<GestorUsuarioListItem[]> {
  const data = await authGetRequest<unknown>(buildUsersLocalListPath(academiasId), authToken);
  const items = Array.isArray(data) ? data : unwrapApiList(data);
  const records = normalizeUsersLocalApiRecords(items);
  return mapUsersLocalToGestorList(records, academiasId);
}

export async function approveGestorMorador(
  userslocalId: number,
  authToken: string,
): Promise<string> {
  await updateUsersLocalRecord(userslocalId, { aprovado: true }, authToken);

  return APPROVE_SUCCESS_MESSAGE;
}

export async function setGestorMoradorBloqueio(
  userslocalId: number,
  bloqueio: boolean,
  authToken: string,
): Promise<string> {
  const payload = await authPatchRequest<unknown>(
    API_ENDPOINTS.usersLocalBloqueio,
    authToken,
    {
      userslocal_id: userslocalId,
      bloqueio,
    },
  );

  return readBackendMensagem(
    payload,
    bloqueio ? BLOCK_SUCCESS_MESSAGE : UNBLOCK_SUCCESS_MESSAGE,
  );
}

export async function setGestorMoradorGestor(
  userslocalId: number,
  gestor: boolean,
  authToken: string,
): Promise<string> {
  const payload = await authPatchRequest<unknown>(
    API_ENDPOINTS.usersLocalGestor,
    authToken,
    {
      userslocal_id: userslocalId,
      gestor,
    },
  );

  return readBackendMensagem(
    payload,
    gestor ? GESTOR_SUCCESS_MESSAGE : UNSET_GESTOR_SUCCESS_MESSAGE,
  );
}

export async function deleteGestorMorador(
  userslocalId: number,
  authToken: string,
): Promise<string> {
  await deleteUsersLocalRecord(userslocalId, authToken);
  return LISTA_USUARIOS_GESTOR_MESSAGES.deleteSuccess;
}
