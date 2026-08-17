import { APP_VERSION } from '@/constants/app-version';
import type { RemoteVersion } from '@/types/version';
import { compareVersions } from '@/utils/compare-versions';
import {
  consumePendingUpdateVersion,
  dismissUpdateForSession,
  getDismissedUpdateVersion,
  markUpdateInProgress,
  saveInstalledVersion,
} from '@/utils/web-version-storage';

export const VERSION_CHECK_MIN_INTERVAL_MS = 5 * 60 * 1000;
export const UPDATE_FAILED_MESSAGE =
  'Não foi possível concluir a atualização. Limpe o cache do navegador ou tente novamente em instantes.';

function isValidRemoteVersion(value: unknown): value is RemoteVersion {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return typeof record.version === 'string' && record.version.trim().length > 0;
}

export function buildVersionJsonUrl(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const versionUrl = new URL('version.json', document.baseURI);
  versionUrl.searchParams.set('_', Date.now().toString());

  return versionUrl.toString();
}

export function isRemoteVersionNewer(remoteVersion: string): boolean {
  return compareVersions(APP_VERSION, remoteVersion) < 0;
}

export function syncInstalledVersionWhenCurrent(remote: RemoteVersion | null): void {
  if (!remote) {
    return;
  }

  if (compareVersions(APP_VERSION, remote.version) === 0) {
    saveInstalledVersion(APP_VERSION);
  }
}

export async function fetchRemoteVersion(): Promise<RemoteVersion | null> {
  const versionUrl = buildVersionJsonUrl();

  if (!versionUrl) {
    return null;
  }

  try {
    const response = await fetch(versionUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      if (__DEV__) {
        console.warn('version.json indisponível:', response.status);
      }

      return null;
    }

    const payload: unknown = await response.json();

    if (!isValidRemoteVersion(payload)) {
      if (__DEV__) {
        console.warn('version.json inválido');
      }

      return null;
    }

    return {
      version: payload.version.trim(),
      build: typeof payload.build === 'string' ? payload.build : undefined,
      mandatory: payload.mandatory === true,
      message: typeof payload.message === 'string' ? payload.message : '',
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('Falha ao buscar version.json:', error);
    }

    return null;
  }
}

export function shouldShowUpdateModal(remote: RemoteVersion | null): boolean {
  if (!remote || !isRemoteVersionNewer(remote.version)) {
    return false;
  }

  return getDismissedUpdateVersion() !== remote.version;
}

export function dismissUpdate(remoteVersion: string): void {
  dismissUpdateForSession(remoteVersion);
}

export async function updateApplication(remoteVersion: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  markUpdateInProgress(remoteVersion);

  try {
    const registrations = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];

    await Promise.all(
      registrations.map((registration) => registration.unregister().catch(() => undefined)),
    );
  } catch {
    // Continue with navigation even if service worker cleanup fails.
  }

  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
  } catch {
    // Continue with navigation even if cache cleanup fails.
  }

  const reloadUrl = buildHardReloadUrl(remoteVersion);

  try {
    await fetch(reloadUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  } catch {
    // Continue with navigation even if prefetch fails.
  }

  window.location.replace(reloadUrl);
}

function buildHardReloadUrl(remoteVersion: string): string {
  const reloadUrl = new URL(window.location.href);
  reloadUrl.searchParams.set('app_update', `${remoteVersion}-${Date.now()}`);
  reloadUrl.hash = '';

  return reloadUrl.toString();
}

export function initializeVersionCheckState(): string | null {
  return consumePendingUpdateVersion();
}

export function getPendingUpdateFailureMessage(pendingVersion: string | null): string | null {
  if (!pendingVersion) {
    return null;
  }

  if (compareVersions(APP_VERSION, pendingVersion) < 0) {
    return UPDATE_FAILED_MESSAGE;
  }

  return null;
}

export { getDismissedUpdateVersion };
