import { Platform } from 'react-native';

import {
  INSTALLED_VERSION_STORAGE_KEY,
  UPDATE_DISMISSED_SESSION_KEY,
  UPDATE_IN_PROGRESS_SESSION_KEY,
} from '@/constants/storage-keys';

export {
  INSTALLED_VERSION_STORAGE_KEY,
  UPDATE_DISMISSED_SESSION_KEY,
  UPDATE_IN_PROGRESS_SESSION_KEY,
};

const FALLBACK_INSTALLED_VERSION = '0.0.0';

function canUseWebStorage(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

export function getInstalledVersion(): string {
  if (!canUseWebStorage()) {
    return FALLBACK_INSTALLED_VERSION;
  }

  try {
    return window.localStorage.getItem(INSTALLED_VERSION_STORAGE_KEY) ?? FALLBACK_INSTALLED_VERSION;
  } catch {
    return FALLBACK_INSTALLED_VERSION;
  }
}

export function saveInstalledVersion(version: string): void {
  if (!canUseWebStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(INSTALLED_VERSION_STORAGE_KEY, version);
  } catch {
    // Ignore storage failures.
  }
}

export function clearUpdateInProgressFlag(): void {
  if (!canUseWebStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(UPDATE_IN_PROGRESS_SESSION_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function consumePendingUpdateVersion(): string | null {
  if (!canUseWebStorage()) {
    return null;
  }

  try {
    const pendingVersion = window.sessionStorage.getItem(UPDATE_IN_PROGRESS_SESSION_KEY);
    window.sessionStorage.removeItem(UPDATE_IN_PROGRESS_SESSION_KEY);
    return pendingVersion?.trim() || null;
  } catch {
    return null;
  }
}

export function markUpdateInProgress(version: string): void {
  if (!canUseWebStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(UPDATE_IN_PROGRESS_SESSION_KEY, version);
  } catch {
    // Ignore storage failures.
  }
}

export function getDismissedUpdateVersion(): string | null {
  if (!canUseWebStorage()) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(UPDATE_DISMISSED_SESSION_KEY);
  } catch {
    return null;
  }
}

export function dismissUpdateForSession(version: string): void {
  if (!canUseWebStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(UPDATE_DISMISSED_SESSION_KEY, version);
  } catch {
    // Ignore storage failures.
  }
}
