import { buildAlterarNomePath } from '@/constants/api';
import { ApiError, authPatchRequest, authPostRequest } from '@/services/api-client';
import { readPersonName, normalizeRecordId } from '@/utils/normalize-api-fields';
import { formatRegisteredPersonName } from '@/utils/meus-dados';

export type AlterarNomePayload = {
  novoNome: string;
};

export type AlterarNomeResponse = {
  sucesso?: boolean;
  nome?: string;
  message?: string;
};

function readNomeFromResponse(record: Record<string, unknown>): string {
  const novoNome =
    typeof record.novoNome === 'string' ? formatRegisteredPersonName(record.novoNome) : '';

  return (
    novoNome ||
    readPersonName(record) ||
    (typeof record.nome === 'string' ? formatRegisteredPersonName(record.nome) : '')
  );
}

function resolveAlterarNomeFromResponse(payload: unknown, expectedName: string): string {
  if (payload === null || payload === undefined) {
    throw new ApiError('Resposta vazia ao alterar nome. Tente novamente.');
  }

  if (typeof payload !== 'object') {
    throw new ApiError('Resposta inválida ao alterar nome.');
  }

  const record = payload as Record<string, unknown>;

  if (record.sucesso === false) {
    const message =
      (typeof record.message === 'string' && record.message.trim()) ||
      'Não foi possível atualizar seu nome. Tente novamente.';

    throw new ApiError(message);
  }

  const nome = readNomeFromResponse(record);

  if (record.sucesso === true) {
    return nome || expectedName;
  }

  if (nome) {
    return nome;
  }

  if (normalizeRecordId(record.id) !== null) {
    return expectedName;
  }

  throw new ApiError('Não foi possível confirmar a alteração do nome.');
}

async function requestAlterarNome(
  usersId: number,
  payload: AlterarNomePayload,
  authToken: string,
): Promise<unknown> {
  const path = buildAlterarNomePath(usersId);

  console.log('Alterar nome — requisição:', path, payload);

  try {
    return await authPatchRequest<unknown>(path, authToken, payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 405) {
      return authPostRequest<unknown>(path, authToken, payload);
    }

    throw error;
  }
}

export async function alterarNomeUsuario(
  usersId: number,
  nome: string,
  authToken: string,
): Promise<string> {
  if (!Number.isFinite(usersId) || usersId <= 0) {
    throw new ApiError('Usuário não identificado para alteração de nome.');
  }

  const normalizedName = formatRegisteredPersonName(nome);
  const payload: AlterarNomePayload = { novoNome: normalizedName };
  const response = await requestAlterarNome(usersId, payload, authToken);

  return resolveAlterarNomeFromResponse(response, normalizedName);
}
