import type { User } from '@/types/user';
import {
  canAccessAdministracaoAcademia,
  canAccessAdministracaoSistema,
  canShowAdministracaoEntry,
  shouldShowUsuariosInHeaderMenu,
} from '@/utils/club-config';

export const ADMINISTRACAO_SISTEMA_ROUTES = new Set([
  'lista-acessos',
  'lista-logins',
  'lista-logados',
]);

export const ADMINISTRACAO_CLUBE_ROUTES = new Set([
  'configuracao-local',
  'cadastro-atividades',
  'cadastro-horarios',
  'lista-usuarios-gestor',
  'lista-usuarios-suspensos',
  'lista-reservas-atividade',
  'lista-reservas-periodo',
  'programacao-atividades',
  'mapa-frequencia',
  'relatorio-lista-espera',
]);

const ADMINISTRACAO_SHARED_MENU_ROUTES = new Set(['lista-presenca', 'lista-reservas']);

/** Telas de perfil e uso comum — sempre acessíveis com sessão válida. */
export const PUBLIC_AUTHENTICATED_ROUTES = new Set([
  'meus-dados',
  'minhas-reservas',
  'mapa-horarios',
  'reservar-horario',
  'lista-espera',
  'lista-espera-horarios',
]);

export function isAdministracaoChildRoute(routeName: string): boolean {
  return (
    ADMINISTRACAO_SISTEMA_ROUTES.has(routeName) ||
    ADMINISTRACAO_CLUBE_ROUTES.has(routeName) ||
    ADMINISTRACAO_SHARED_MENU_ROUTES.has(routeName)
  );
}

export function getActiveRouteName(segments: string[]): string {
  const routeSegments = segments.filter((segment) => !segment.startsWith('('));
  return routeSegments[routeSegments.length - 1] ?? '';
}

export function isAuthRoute(segments: string[]): boolean {
  const routeName = getActiveRouteName(segments);

  return segments.includes('(auth)') || routeName === 'login' || routeName === 'signup';
}

export function canUserAccessRoute(user: User, routeName: string): boolean {
  if (!routeName || routeName === 'index' || routeName === 'explore') {
    return true;
  }

  if (PUBLIC_AUTHENTICATED_ROUTES.has(routeName)) {
    return true;
  }

  if (routeName === 'administracao') {
    return canShowAdministracaoEntry(user);
  }

  if (routeName === 'usuarios') {
    return shouldShowUsuariosInHeaderMenu(user);
  }

  if (ADMINISTRACAO_SISTEMA_ROUTES.has(routeName)) {
    return canAccessAdministracaoSistema(user);
  }

  if (ADMINISTRACAO_CLUBE_ROUTES.has(routeName)) {
    return canAccessAdministracaoAcademia(user);
  }

  return true;
}

export function getAdministracaoEntryRoute(user: User): '/administracao' | null {
  if (canShowAdministracaoEntry(user)) {
    return '/administracao';
  }

  return null;
}
