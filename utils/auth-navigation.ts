import type { Router } from 'expo-router';
import { Platform } from 'react-native';

/** Rota da home (tabs/index). */
export const HOME_ROUTE = '/(tabs)' as const;

export const LOGIN_ROUTE = '/login' as const;

function isAuthPath(pathname: string): boolean {
  return pathname.includes('/login') || pathname.includes('/signup');
}

function resolveWebHomeUrl(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  return '/';
}

/** Redireciona para a home após login ou cadastro. */
export function navigateToHome(router: Pick<Router, 'replace'>): void {
  router.replace(HOME_ROUTE);

  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  window.requestAnimationFrame(() => {
    if (isAuthPath(window.location.pathname)) {
      window.location.replace(resolveWebHomeUrl());
    }
  });
}
