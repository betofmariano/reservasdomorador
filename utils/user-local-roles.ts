import type { UserLocalAssociation } from '@/types/user-local';

type LocalRoleSource = Pick<UserLocalAssociation, 'gestor' | 'professor'>;

/**
 * Roles efetivos da associação userslocal.
 * Quando gestor e professor vêm juntos no mesmo registro (legado Bubble),
 * mantém os dois — gestor precisa continuar acessando Administração/Gestão.
 */
export function resolveEffectiveLocalRoles(association: LocalRoleSource): {
  gestor: boolean;
  professor: boolean;
} {
  return {
    gestor: association.gestor === true,
    professor: association.professor === true,
  };
}

export function resolvesEffectiveGestor(association: LocalRoleSource): boolean {
  return resolveEffectiveLocalRoles(association).gestor;
}

export function resolvesEffectiveProfessor(association: LocalRoleSource): boolean {
  return resolveEffectiveLocalRoles(association).professor;
}
