import type { Academia } from '@/types/academia';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import { canManageAcademia } from '@/utils/club-config';
import { isModuloAtivoNaAcademia } from '@/utils/academia-permissoes-gestor';
import { isModuloAtivoParaProfessor } from '@/utils/academia-permissoes-professor';
import { normalizeBoolean, normalizeRecordId } from '@/utils/normalize-api-fields';
import { resolvesEffectiveProfessor } from '@/utils/user-local-roles';

function isActiveLocalAssociation(association: UserLocalAssociation): boolean {
  return association.aprovado && !association.bloqueado;
}

export function isUserProfessorOfAcademia(
  user: User,
  academiasId: number,
  associations: UserLocalAssociation[] = [],
): boolean {
  const normalizedAcademiasId = normalizeRecordId(academiasId);

  if (normalizedAcademiasId == null) {
    return false;
  }

  const userIsProfessor = normalizeBoolean(user.professor);

  return associations.some((association) => {
    const associationAcademiasId = normalizeRecordId(association.academias_id);
    const associationUsersId = normalizeRecordId(association.users_id);

    return (
      associationUsersId === user.id &&
      associationAcademiasId === normalizedAcademiasId &&
      isActiveLocalAssociation(association) &&
      (resolvesEffectiveProfessor(association) || userIsProfessor)
    );
  });
}

export function canAccessAcademiaListaPresenca(
  academia: Academia | null | undefined,
  associations: UserLocalAssociation[] = [],
  user?: User | null,
): boolean {
  if (!academia || !isModuloAtivoNaAcademia(academia, 'listaPresenca')) {
    return false;
  }

  if (!user) {
    return false;
  }

  return (
    canManageAcademia(user, academia.id, associations) ||
    (isUserProfessorOfAcademia(user, academia.id, associations) &&
      isModuloAtivoParaProfessor(academia, 'listaPresenca'))
  );
}

export function filterAcademiasForListaPresenca(
  academias: Academia[],
  associations: UserLocalAssociation[] = [],
  user?: User | null,
): Academia[] {
  return academias.filter((academia) =>
    canAccessAcademiaListaPresenca(academia, associations, user),
  );
}

export function canAccessListaPresencaPage(
  academias: Academia[],
  associations: UserLocalAssociation[] = [],
  user?: User | null,
): boolean {
  if (!user) {
    return false;
  }

  return filterAcademiasForListaPresenca(academias, associations, user).length > 0;
}

export function canCancelReservaListaPresenca(
  user: User | null | undefined,
  academiasId: number,
  associations: UserLocalAssociation[] = [],
): boolean {
  if (!user) {
    return false;
  }

  return (
    canManageAcademia(user, academiasId, associations) ||
    isUserProfessorOfAcademia(user, academiasId, associations)
  );
}

export function countAccessibleListaPresencaLocais(
  academias: Academia[],
  associations: UserLocalAssociation[] = [],
  user?: User | null,
): number {
  if (!user) {
    return 0;
  }

  const accessibleIds = new Set(
    filterAcademiasForListaPresenca(academias, associations, user).map((academia) => academia.id),
  );

  return associations.filter((association) => {
    const associationUsersId = normalizeRecordId(association.users_id);

    return (
      associationUsersId === user.id &&
      isActiveLocalAssociation(association) &&
      accessibleIds.has(association.academias_id)
    );
  }).length;
}
