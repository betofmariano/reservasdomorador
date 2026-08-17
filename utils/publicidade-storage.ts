import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const PUBLICIDADE_VIEW_STORAGE_KEY = 'matchplace:last-ad-view-at';
const PUBLICIDADE_IMPRESSION_STORAGE_PREFIX = 'matchplace:impression:';
const PUBLICIDADE_IMPRESSION_DEDUPE_MS = 15 * 60 * 1000;

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export async function getLastAdvertisementViewAt(): Promise<number | null> {
  try {
    if (Platform.OS === 'web') {
      if (!canUseLocalStorage()) {
        return null;
      }

      const value = window.localStorage.getItem(PUBLICIDADE_VIEW_STORAGE_KEY);
      return parseStoredTimestamp(value);
    }

    const value = await AsyncStorage.getItem(PUBLICIDADE_VIEW_STORAGE_KEY);
    return parseStoredTimestamp(value);
  } catch {
    return null;
  }
}

export async function setLastAdvertisementViewAt(timestamp: number): Promise<void> {
  const value = String(timestamp);

  try {
    if (Platform.OS === 'web') {
      if (!canUseLocalStorage()) {
        return;
      }

      window.localStorage.setItem(PUBLICIDADE_VIEW_STORAGE_KEY, value);
      return;
    }

    await AsyncStorage.setItem(PUBLICIDADE_VIEW_STORAGE_KEY, value);
  } catch {
    // Falha local não deve bloquear a Home.
  }
}

function parseStoredTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function buildImpressionStorageKey(
  userId: number,
  publicidadeId: number,
  display: string,
): string {
  return `${PUBLICIDADE_IMPRESSION_STORAGE_PREFIX}${userId}:${publicidadeId}:${display}`;
}

export async function hasRecentStoredImpression(
  key: string,
  maxAgeMs: number = PUBLICIDADE_IMPRESSION_DEDUPE_MS,
): Promise<boolean> {
  try {
    const storedAt = await readStorageValue(key);
    const timestamp = parseStoredTimestamp(storedAt);

    if (timestamp === null) {
      return false;
    }

    return Date.now() - timestamp < maxAgeMs;
  } catch {
    return false;
  }
}

export async function markStoredImpression(
  key: string,
  timestamp: number = Date.now(),
): Promise<void> {
  await writeStorageValue(key, String(timestamp));
}

export async function clearStoredImpression(key: string): Promise<void> {
  await removeStorageValue(key);
}

async function readStorageValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  return AsyncStorage.getItem(key);
}

async function writeStorageValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

async function removeStorageValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.removeItem(key);
    return;
  }

  await AsyncStorage.removeItem(key);
}
