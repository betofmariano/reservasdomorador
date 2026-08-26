import { formatAssociacaoLocalFallback } from '@/constants/associacao-local-labels';
import { API_ENDPOINTS, buildUserLocalAssociationsPath } from '@/constants/api';
import { ApiError, authGetRequest, authPostRequest, getRequest, postRequest } from '@/services/api-client';
import type { Academia } from '@/types/academia';
import type {
  AssociatedLocalDisplay,
  CreateUserLocalPayload,
  CreateUserLocalResponse,
  UserLocalAssociation,
  UserLocalAssociationsResponse,
} from '@/types/user-local';
import { sortByClubNome } from '@/utils/club-sort';
import { normalizeRecordId } from '@/utils/normalize-api-fields';
import { normalizeUserLocalListFromApi } from '@/utils/normalize-user-local';
import type { User } from '@/types/user';

async function requestUserLocalRecords(
  userId: number,
  authToken?: string | null,
): Promise<unknown> {
  const path = buildUserLocalAssociationsPath(userId);

  if (authToken) {
    return authGetRequest<unknown>(path, authToken);
  }

  return getRequest<unknown>(path);
}

export function findUserLocalAssociationForAcademia(
  associations: UserLocalAssociation[],
  academiasId: number,
): UserLocalAssociation | undefined {
  const normalizedAcademiaId = normalizeRecordId(academiasId);

  if (normalizedAcademiaId == null) {
    return undefined;
  }

  return associations.find(
    (association) => normalizeRecordId(association.academias_id) === normalizedAcademiaId,
  );
}

export function buildAssociationFromUser(user: User): UserLocalAssociation | null {
  const condominioId = normalizeRecordId(user.academias_id ?? user.localPrioritario);

  if (condominioId == null || condominioId <= 0 || user.id <= 0) {
    return null;
  }

  return {
    id: user.userslocalId ?? 0,
    nome: user.nome,
    ultimoAcesso: null,
    users_id: user.id,
    academias_id: condominioId,
    aprovado: user.aprovado,
    administrador: user.administrador,
    gestor: user.gestor,
    professor: user.professor === true,
    bloqueado: user.bloqueado,
    cienteCancelamento: user.cienteCancelamento,
    matricula: user.matricula,
    socioTitulo: user.matricula,
    complemento: user.complemento,
    dataRegulamento: null,
  };
}

export async function getUserLocalAssociations(
  userId: number,
  authToken?: string | null,
): Promise<UserLocalAssociationsResponse> {
  const data = await requestUserLocalRecords(userId, authToken);
  const associations = normalizeUserLocalListFromApi(data).filter(
    (association) => association.users_id === userId,
  );

  console.log('Resposta meusLocais (associações):', associations.length);

  return associations;
}

export async function getUserLocalAssociationsForUser(
  user: User,
  authToken?: string | null,
): Promise<UserLocalAssociationsResponse> {
  let associations: UserLocalAssociation[] = [];

  try {
    associations = await getUserLocalAssociations(user.id, authToken);
  } catch (error) {
    console.warn('GET /meusLocais indisponível; usando vínculo da sessão.', error);
  }

  if (associations.length === 0) {
    const fallback = buildAssociationFromUser(user);
    associations = fallback ? [fallback] : [];
  }

  return associations;
}

/** @deprecated Use getUserLocalAssociations */
export const getClubesUsuario = getUserLocalAssociations;

export function buildCreateUserLocalAssociationPayload(
  user: Pick<User, 'id' | 'nome'>,
  academiasId: number,
): CreateUserLocalPayload {
  return {
    users_id: user.id,
    academias_id: academiasId,
    nome: user.nome.trim(),
  };
}

export async function createUserLocalAssociation(
  payload: CreateUserLocalPayload,
  authToken?: string | null,
): Promise<CreateUserLocalResponse> {
  const body = {
    users_id: payload.users_id,
    condominio_id: payload.academias_id,
    nome: payload.nome,
  };

  if (authToken) {
    return authPostRequest<CreateUserLocalResponse>(API_ENDPOINTS.userslocal, authToken, body);
  }

  return postRequest<CreateUserLocalResponse>(API_ENDPOINTS.userslocal, body);
}

export function isDuplicateAssociationError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('já existe') ||
    message.includes('ja existe') ||
    message.includes('already exists') ||
    message.includes('duplicate') ||
    message.includes('duplicat')
  );
}

export function getAssociationStatusLabel(association: UserLocalAssociation): string {
  if (association.bloqueado) {
    return 'Bloqueado';
  }

  if (association.aprovado) {
    return 'Aprovado';
  }

  return 'Pendente';
}

export function enrichAssociationsWithAcademias(
  associations: UserLocalAssociation[],
  academias: Academia[],
): AssociatedLocalDisplay[] {
  const academiasById = new Map(academias.map((academia) => [academia.id, academia]));

  return sortByClubNome(
    associations.map((association) => {
      const academia = academiasById.get(association.academias_id);

      return {
        association,
        nome: academia?.nome ?? formatAssociacaoLocalFallback(association.academias_id),
        logoUrl: academia?.logoUrl || undefined,
      };
    }),
  );
}

export function filterAvailableAcademias(
  academias: Academia[],
  associatedAcademiaIds: number[],
): Academia[] {
  const associatedIds = new Set(associatedAcademiaIds);

  return sortByClubNome(academias.filter((academia) => !associatedIds.has(academia.id)));
}
