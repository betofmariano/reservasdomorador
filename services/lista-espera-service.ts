import {
  API_ENDPOINTS,
  buildListaEsperaItemPath,
  buildListaEsperaListPath,
} from '@/constants/api';
import { ApiError, authDeleteRequest, authGetRequest, authPatchRequest, authPostRequest } from '@/services/api-client';
import { sendWzapEsperaMatchPlace } from '@/services/jogos-service';
import type {
  AssociatedClubOption,
  CreateListaEsperaPayload,
  CreateListaEsperaResponse,
  ListaEsperaDisplay,
  ListaEsperaRegistro,
} from '@/types/lista-espera';
import type { Club } from '@/types/club';
import { sortByClubNome } from '@/utils/club-sort';
import {
  normalizeListaEsperaFromApi,
  normalizeListaEsperaListFromApi,
} from '@/utils/normalize-lista-espera';
import { filterListaEsperaPendentes } from '@/utils/lista-espera-visivel';
import {
  resolveNomeCadastroUsuario,
  resolveTelefoneCadastroUsuario,
} from '@/utils/lista-espera-contato';
import type { User } from '@/types/user';

export async function getListaEsperaByUser(
  userId: number,
  authToken: string,
): Promise<ListaEsperaRegistro[]> {
  const data = await authGetRequest<unknown>(
    buildListaEsperaListPath({ users_id: userId }),
    authToken,
  );

  return filterListaEsperaPendentes(normalizeListaEsperaListFromApi(data));
}

export async function getListaEsperaForUser(
  userId: number,
  academiasIds: number[],
  authToken: string,
): Promise<ListaEsperaRegistro[]> {
  const registros = await getListaEsperaByUser(userId, authToken);
  const allowedAcademias = new Set(academiasIds);

  return registros.filter((registro) => {
    if (registro.users_id !== userId) {
      return false;
    }

    if (academiasIds.length === 0) {
      return true;
    }

    return allowedAcademias.has(registro.academias_id);
  });
}

export async function deleteListaEsperaEntry(
  listaesperaId: number,
  authToken: string,
): Promise<void> {
  await authDeleteRequest<Record<string, never>>(
    buildListaEsperaItemPath(listaesperaId),
    authToken,
  );
}

export async function syncListaEsperaContatoFromUsuario(
  listaesperaId: number,
  user: User,
  authToken: string,
): Promise<ListaEsperaRegistro | null> {
  const telefone = resolveTelefoneCadastroUsuario(user);
  const nome = resolveNomeCadastroUsuario(user);

  if (!telefone && !nome) {
    return null;
  }

  const payload: Record<string, string> = {};

  if (telefone) {
    payload.telefone = telefone;
  }

  if (nome) {
    payload.nome = nome;
  }

  const data = await authPatchRequest<unknown>(
    buildListaEsperaItemPath(listaesperaId),
    authToken,
    payload,
  );

  return normalizeListaEsperaFromApi(data);
}

export async function marcarListaEsperaComoAvisada(
  listaesperaId: number,
  authToken: string,
): Promise<ListaEsperaRegistro | null> {
  const data = await authPatchRequest<unknown>(
    buildListaEsperaItemPath(listaesperaId),
    authToken,
    {
      avisado: true,
      avisar: false,
    },
  );

  return normalizeListaEsperaFromApi(data);
}

export type NotifyListaEsperaPromovidaPayload = {
  academias_id: number;
  atividades_id: number;
  dataAtividade: number;
};

export async function notifyListaEsperaPromovidaViaWhatsApp(
  payload: NotifyListaEsperaPromovidaPayload,
): Promise<void> {
  try {
    await sendWzapEsperaMatchPlace(payload);

    if (__DEV__) {
      console.log('WhatsApp da lista de espera solicitado');
    }
  } catch {
    console.log('Não foi possível enviar WhatsApp da lista de espera');
  }
}

export async function createWaitingListEntry(
  payload: CreateListaEsperaPayload,
  authToken: string,
): Promise<CreateListaEsperaResponse> {
  console.log('Criando registro na lista de espera');
  console.log('Local selecionado:', payload.academias_id);
  console.log('Atividade selecionada:', payload.atividades_id);

  const data = await authPostRequest<unknown>(
    API_ENDPOINTS.listaespera,
    authToken,
    {
      ...payload,
      email: payload.email ?? '',
    },
  );

  const registro = normalizeListaEsperaFromApi(data);

  if (!registro) {
    throw new ApiError('Não foi possível concluir a operação. Tente novamente.');
  }

  console.log('Resposta da lista de espera recebida');
  console.log('Registro criado com sucesso');

  return registro;
}

export function isDuplicateWaitingListError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('já está') ||
    message.includes('ja esta') ||
    message.includes('já existe') ||
    message.includes('ja existe') ||
    message.includes('already') ||
    message.includes('duplicate') ||
    message.includes('duplicat')
  );
}

export function buildAssociatedAcademiaOptions(
  associations: Array<{ academias_id: number }>,
  academias: import('@/types/academia').Academia[],
): AssociatedClubOption[] {
  const academiasById = new Map(academias.map((academia) => [academia.id, academia]));

  return sortByClubNome(
    associations.map((association) => {
      const academia = academiasById.get(association.academias_id);

      return {
        id: association.academias_id,
        nome: academia?.nome ?? `Local #${association.academias_id}`,
      };
    }),
  );
}

/** @deprecated Use buildAssociatedAcademiaOptions */
export function buildAssociatedClubOptions(
  associations: Array<{ academias_id: number }>,
  clubs: Club[],
): AssociatedClubOption[] {
  return buildAssociatedAcademiaOptions(
    associations,
    clubs as unknown as import('@/types/academia').Academia[],
  );
}

export function enrichListaEsperaWithAcademias(
  registros: ListaEsperaRegistro[],
  academias: import('@/types/academia').Academia[],
): ListaEsperaDisplay[] {
  const academiasById = new Map(academias.map((academia) => [academia.id, academia]));

  return registros.map((registro) => ({
    registro,
    localNome: academiasById.get(registro.academias_id)?.nome ?? `Local #${registro.academias_id}`,
  }));
}

/** @deprecated Use enrichListaEsperaWithAcademias */
export function enrichListaEsperaWithClubs(
  registros: ListaEsperaRegistro[],
  clubs: Club[],
): ListaEsperaDisplay[] {
  return enrichListaEsperaWithAcademias(
    registros,
    clubs as unknown as import('@/types/academia').Academia[],
  );
}

/** @deprecated Use getListaEsperaForUser */
export const getListaEsperaByClube = getListaEsperaByUser;
