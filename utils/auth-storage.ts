import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Chave web legado deste app; inválida no SecureStore nativo. Sem fallback do MatchPlace. */
const LEGACY_AUTH_TOKEN_KEY = '@reservasdomorador:authToken';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export async function getStoredAuthToken(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return null;
    }

    const current = window.localStorage.getItem(key);

    if (current) {
      return current;
    }

    const legacy = window.localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);

    if (legacy) {
      window.localStorage.setItem(key, legacy);
      window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
      return legacy;
    }

    return null;
  }

  return SecureStore.getItemAsync(key);
}

export async function setStoredAuthToken(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(key, value);
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function removeStoredAuthToken(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.removeItem(key);
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
