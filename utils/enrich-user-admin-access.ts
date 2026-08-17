import { getUserLocalAssociations } from '@/services/user-local-service';
import type { User } from '@/types/user';
import {
  canShowAdministracaoEntry,
  canShowAdministracaoEntryFromAssociations,
  isUserAdministrador,
  isUserGestor,
  isUserProfessor,
} from '@/utils/club-config';
import { normalizeRecordId } from '@/utils/normalize-api-fields';
import { resolveEffectiveLocalRoles } from '@/utils/user-local-roles';

function mergeEffectiveLocalRoles(user: User, associations: Awaited<ReturnType<typeof getUserLocalAssociations>>): User {
  let gestor = user.gestor;
  let professor = user.professor === true;

  for (const association of associations) {
    if (normalizeRecordId(association.users_id) !== user.id) {
      continue;
    }

    const effective = resolveEffectiveLocalRoles(association);
    gestor = gestor || effective.gestor;
    professor = professor || effective.professor;
  }

  if (gestor === user.gestor && professor === (user.professor === true)) {
    return user;
  }

  return {
    ...user,
    gestor,
    professor,
  };
}

export async function resolveAdministracaoEntryAccess(user: User): Promise<boolean> {
  if (canShowAdministracaoEntry(user)) {
    return true;
  }

  try {
    const associations = await getUserLocalAssociations(user.id);
    return canShowAdministracaoEntryFromAssociations(user, associations);
  } catch {
    return false;
  }
}

export async function enrichUserLocalRoles(user: User): Promise<User> {
  if (
    isUserAdministrador(user) ||
    (isUserGestor(user) && !isUserProfessor(user)) ||
    isUserProfessor(user)
  ) {
    return user;
  }

  try {
    const associations = await getUserLocalAssociations(user.id);

    if (!canShowAdministracaoEntryFromAssociations(user, associations)) {
      const hasProfessorRole = associations.some((association) => {
        if (normalizeRecordId(association.users_id) !== user.id) {
          return false;
        }

        return resolveEffectiveLocalRoles(association).professor;
      });

      if (!hasProfessorRole) {
        return user;
      }
    }

    return mergeEffectiveLocalRoles(user, associations);
  } catch {
    return user;
  }
}

/** @deprecated Use enrichUserLocalRoles */
export const enrichUserAdministracaoAccess = enrichUserLocalRoles;
