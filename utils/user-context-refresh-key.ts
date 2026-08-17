import type { User } from '@/types/user';

/** Campos que alteram associação, papéis ou local efetivo no contexto. */
export function buildUserContextRefreshKey(user: User | null | undefined): string | null {
  if (!user?.id) {
    return null;
  }

  return [
    user.id,
    user.localPrioritario ?? '',
    user.academias_id ?? '',
    user.gestor ? 1 : 0,
    user.administrador ? 1 : 0,
    user.professor ? 1 : 0,
    user.aprovado ? 1 : 0,
    user.bloqueado ? 1 : 0,
    user.excluido ? 1 : 0,
  ].join(':');
}
