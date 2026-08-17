import type { Academia } from '@/types/academia';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import { filterActiveAcademias } from '@/utils/normalize-academia';
import { normalizeRecordId } from '@/utils/normalize-api-fields';

export function isUserGloballyExcluded(user: User | null | undefined): boolean {
  return user?.excluido === true;
}

export function isValidUserLocalAssociation(
  association: UserLocalAssociation,
  user?: User | null,
): boolean {
  if (isUserGloballyExcluded(user)) {
    return false;
  }

  return association.aprovado && !association.bloqueado;
}

export function filterValidUserLocalAssociations(
  associations: UserLocalAssociation[],
  user?: User | null,
): UserLocalAssociation[] {
  return associations.filter((association) => isValidUserLocalAssociation(association, user));
}

export function findUserLocalAssociation(
  associations: UserLocalAssociation[],
  academiasId: number,
): UserLocalAssociation | null {
  const normalizedAcademiasId = normalizeRecordId(academiasId);

  if (normalizedAcademiasId == null) {
    return null;
  }

  return (
    associations.find(
      (association) => normalizeRecordId(association.academias_id) === normalizedAcademiasId,
    ) ?? null
  );
}

export function isLocalPrioritarioValid(
  localPrioritario: number | null | undefined,
  associations: UserLocalAssociation[],
  academias: Academia[],
  user?: User | null,
): boolean {
  const normalizedId = normalizeRecordId(localPrioritario);

  if (normalizedId == null) {
    return false;
  }

  const activeAcademiaIds = new Set(filterActiveAcademias(academias).map((academia) => academia.id));
  const association = findUserLocalAssociation(associations, normalizedId);

  if (!association || !activeAcademiaIds.has(normalizedId)) {
    return false;
  }

  return isValidUserLocalAssociation(association, user);
}

export function resolveEffectiveLocalPrioritario(input: {
  user: User;
  associations: UserLocalAssociation[];
  academias: Academia[];
  sessionAcademiasId?: number | null;
}): number | null {
  const validAssociations = filterValidUserLocalAssociations(input.associations, input.user);
  const validAcademiaIds = new Set(
    filterActiveAcademias(input.academias)
      .map((academia) => academia.id)
      .filter((id) => validAssociations.some((item) => item.academias_id === id)),
  );

  const validItems = validAssociations.filter((item) => validAcademiaIds.has(item.academias_id));

  if (isLocalPrioritarioValid(input.user.localPrioritario, input.associations, input.academias, input.user)) {
    return normalizeRecordId(input.user.localPrioritario);
  }

  const sessionId = normalizeRecordId(input.sessionAcademiasId ?? input.user.academias_id);

  if (
    sessionId != null &&
    validAcademiaIds.has(sessionId) &&
    validItems.some((item) => item.academias_id === sessionId)
  ) {
    return sessionId;
  }

  if (validItems.length === 1) {
    return validItems[0].academias_id;
  }

  return null;
}

export function requiresUserLocalSelection(input: {
  user: User;
  associations: UserLocalAssociation[];
  academias: Academia[];
  effectiveAcademiasId: number | null;
}): boolean {
  // Administrador não precisa de local prioritário; escolhe o local só nas telas.
  if (input.user.administrador === true) {
    return false;
  }

  const validAssociations = filterValidUserLocalAssociations(input.associations, input.user);
  const validCount = filterActiveAcademias(input.academias).filter((academia) =>
    validAssociations.some((item) => item.academias_id === academia.id),
  ).length;

  if (validCount <= 1) {
    return false;
  }

  return input.effectiveAcademiasId == null;
}
