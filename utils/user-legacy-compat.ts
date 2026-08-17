import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import { resolveEffectiveLocalRoles } from '@/utils/user-local-roles';

/**
 * Camada temporária de compatibilidade com Bubble e campos legados em `users`.
 * Centralizar aqui — não espalhar fallback pelo app.
 */
export function resolveLegacyGestorAcademia(
  user: User | null | undefined,
  currentUserLocal?: UserLocalAssociation | null,
): boolean {
  if (!user) {
    return false;
  }

  if (user.gestor === true) {
    return true;
  }

  if (currentUserLocal) {
    return resolveEffectiveLocalRoles(currentUserLocal).gestor;
  }

  return false;
}

export function resolveLegacyUserAcademiasId(
  user: User | null | undefined,
  effectiveAcademiasId?: number | null,
): number {
  if (effectiveAcademiasId != null && effectiveAcademiasId > 0) {
    return effectiveAcademiasId;
  }

  return user?.academias_id ?? 0;
}
