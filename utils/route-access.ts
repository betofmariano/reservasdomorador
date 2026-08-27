import { APP_OCULTAR_PATROCINADORES } from '@/constants/app-branding';
import type { User } from '@/types/user';
import {
  canAccessAdministracaoAcademia,
  canAccessAdministracaoSistema,
  canShowAdministracaoEntry,
  shouldShowUsuariosInHeaderMenu,
} from '@/utils/club-config';

const PATROCINADOR_ROUTES = new Set(['patrocinador']);

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
]);

const ADMINISTRACAO_SHARED_MENU_ROUTES = new Set(['lista-reservas']);

/** Telas de perfil e uso comum — sempre acessíveis com sessão válida. */
export const PUBLIC_AUTHENTICATED_ROUTES = new Set([
  'meus-dados',
  'minhas-reservas',
  'mapa-horarios',
  'reservar-horario',
]);

/** Páginas públicas — abrem sem login (espelho do site Bubble). */
export const PUBLIC_UNAUTHENTICATED_ROUTES = new Set<string>();

/** Rotas que não devem abrir o modal de seleção de local. */
export const SKIP_LOCAL_SELECTION_ROUTES = new Set<string>();

export function isPublicUnauthenticatedRoute(routeName: string): boolean {
  if (APP_OCULTAR_PATROCINADORES && PATROCINADOR_ROUTES.has(routeName)) {
    return false;
  }

  return PUBLIC_UNAUTHENTICATED_ROUTES.has(routeName);
}

export function shouldSkipLocalSelection(routeName: string): boolean {
  return SKIP_LOCAL_SELECTION_ROUTES.has(routeName);
}

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

  if (APP_OCULTAR_PATROCINADORES && PATROCINADOR_ROUTES.has(routeName)) {
    return false;
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
