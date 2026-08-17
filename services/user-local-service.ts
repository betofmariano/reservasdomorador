import { formatAssociacaoLocalFallback } from '@/constants/associacao-local-labels';
import { API_ENDPOINTS, buildUserLocalAssociationsPath } from '@/constants/api';
import { ApiError, getRequest, postRequest } from '@/services/api-client';
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

export async function getUserLocalAssociations(
  userId: number,
): Promise<UserLocalAssociationsResponse> {
  const data = await getRequest<unknown>(buildUserLocalAssociationsPath(userId));
  const associations = normalizeUserLocalListFromApi(data);

  console.log('Resposta meusLocais (associações):', associations.length);

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
): Promise<CreateUserLocalResponse> {
  return postRequest<CreateUserLocalResponse>(API_ENDPOINTS.userslocal, payload);
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
