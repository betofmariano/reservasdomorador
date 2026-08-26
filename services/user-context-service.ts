import { getAcademias } from '@/services/academias-service';
import type { Academia } from '@/types/academia';
import type {
  BuildUserContextInput,
  UserContextState,
  UserLocalSummary,
} from '@/types/user-context';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import { buildUserContextPermissions } from '@/utils/user-context-permissions';
import {
  filterValidUserLocalAssociations,
  findUserLocalAssociation,
  isValidUserLocalAssociation,
  requiresUserLocalSelection,
  resolveEffectiveLocalPrioritario,
} from '@/utils/user-local-validation';
import { filterActiveAcademias } from '@/utils/normalize-academia';
import { normalizeRecordId } from '@/utils/normalize-api-fields';

function buildAssociationFromAuthenticatedVinculo(user: User): UserLocalAssociation | null {
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

function buildUserLocalSummaries(
  associations: UserLocalAssociation[],
  academias: Academia[],
): UserLocalSummary[] {
  const academiaById = new Map(academias.map((academia) => [academia.id, academia.nome]));

  return associations.map((association) => ({
    id: association.id,
    academias_id: association.academias_id,
    academiaNome: academiaById.get(association.academias_id) ?? `Local #${association.academias_id}`,
    aprovado: association.aprovado,
    gestor: association.gestor,
    professor: association.professor,
    bloqueado: association.bloqueado,
  }));
}

export function buildSelectableUserLocalSummaries(
  associations: UserLocalAssociation[],
  academias: Academia[],
  user: User,
): UserLocalSummary[] {
  const activeAcademias = filterActiveAcademias(academias);
  const activeAcademiaIds = new Set(activeAcademias.map((academia) => academia.id));
  const validAssociations = filterValidUserLocalAssociations(associations, user).filter((association) =>
    activeAcademiaIds.has(association.academias_id),
  );

  return buildUserLocalSummaries(validAssociations, activeAcademias);
}

export function buildUserContextFromRecords(input: BuildUserContextInput): UserContextState {
  const activeAcademias = filterActiveAcademias(input.academias);
  const userLocals = buildUserLocalSummaries(input.associations, activeAcademias);
  const selectableUserLocals = buildSelectableUserLocalSummaries(
    input.associations,
    input.academias,
    input.user,
  );
  const effectiveAcademiasId = resolveEffectiveLocalPrioritario({
    user: input.user,
    associations: input.associations,
    academias: activeAcademias,
    sessionAcademiasId: input.sessionAcademiasId,
  });
  const currentUserLocal =
    effectiveAcademiasId != null
      ? findUserLocalAssociation(input.associations, effectiveAcademiasId)
      : null;
  const currentAcademia =
    effectiveAcademiasId != null
      ? activeAcademias.find((academia) => academia.id === effectiveAcademiasId) ?? null
      : null;

  return {
    user: input.user,
    currentUserLocal,
    currentAcademia: currentAcademia
      ? {
          id: currentAcademia.id,
          nome: currentAcademia.nome,
          mensalSemana: currentAcademia.mensalSemana,
          permissoesGestor: currentAcademia.permissoesGestor,
          permissoesProfessor: currentAcademia.permissoesProfessor,
          permissoesUsuario: currentAcademia.permissoesUsuario,
        }
      : null,
    userLocals,
    selectableUserLocals,
    permissions: buildUserContextPermissions(input.user, currentUserLocal, {
      currentAcademia,
    }),
    effectiveAcademiasId,
    requiresLocalSelection: requiresUserLocalSelection({
      user: input.user,
      associations: input.associations,
      academias: activeAcademias,
      effectiveAcademiasId,
    }),
    isLoading: false,
    error: null,
  };
}

export async function loadUserContextRecords(
  user: User,
  _authToken: string,
): Promise<{
  associations: UserLocalAssociation[];
  academias: Academia[];
}> {
  const academias = await getAcademias();
  const association = buildAssociationFromAuthenticatedVinculo(user);

  return {
    associations: association ? [association] : [],
    academias,
  };
}

export function getValidUserLocalAssociationsForUser(
  associations: UserLocalAssociation[],
  user: User,
): UserLocalAssociation[] {
  return filterValidUserLocalAssociations(associations, user);
}

/**
 * Função central sugerida para backend/endpoints locais.
 * No app, reutiliza a mesma regra sobre os registros já carregados.
 */
export function getAuthenticatedUserLocal(input: {
  authenticatedUserId: number;
  academiaId: number;
  associations: UserLocalAssociation[];
  user: User;
}): UserLocalAssociation | null {
  if (input.authenticatedUserId !== input.user.id) {
    return null;
  }

  const association = findUserLocalAssociation(input.associations, input.academiaId);

  if (!association || !isValidUserLocalAssociation(association, input.user)) {
    return null;
  }

  return association;
}
