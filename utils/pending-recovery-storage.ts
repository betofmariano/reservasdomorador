import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { RECOVERY_CODE_TTL_MS } from '@/constants/auth';
import { PENDING_RECOVERY_STORAGE_KEY } from '@/constants/storage-keys';
import { consultarRecuperacaoPendente } from '@/services/auth-service';
import { BRAZILIAN_MOBILE_PHONE_DIGITS } from '@/utils/phone-mask';

export type PendingRecoveryState = {
  telefoneLimpo: string;
  requestedAt: number;
};

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isValidPendingRecovery(value: PendingRecoveryState): boolean {
  if (!value.telefoneLimpo || value.telefoneLimpo.length !== BRAZILIAN_MOBILE_PHONE_DIGITS) {
    return false;
  }

  if (!Number.isFinite(value.requestedAt) || value.requestedAt <= 0) {
    return false;
  }

  return Date.now() - value.requestedAt <= RECOVERY_CODE_TTL_MS;
}

function parsePendingRecovery(raw: string | null): PendingRecoveryState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PendingRecoveryState>;

    if (typeof parsed.telefoneLimpo !== 'string' || typeof parsed.requestedAt !== 'number') {
      return null;
    }

    const pending: PendingRecoveryState = {
      telefoneLimpo: parsed.telefoneLimpo,
      requestedAt: parsed.requestedAt,
    };

    return isValidPendingRecovery(pending) ? pending : null;
  } catch {
    return null;
  }
}

async function readRawPendingRecovery(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return null;
    }

    return window.localStorage.getItem(PENDING_RECOVERY_STORAGE_KEY);
  }

  return AsyncStorage.getItem(PENDING_RECOVERY_STORAGE_KEY);
}

async function writeRawPendingRecovery(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(PENDING_RECOVERY_STORAGE_KEY, value);
    return;
  }

  await AsyncStorage.setItem(PENDING_RECOVERY_STORAGE_KEY, value);
}

async function removeRawPendingRecovery(): Promise<void> {
  if (Platform.OS === 'web') {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.removeItem(PENDING_RECOVERY_STORAGE_KEY);
    return;
  }

  await AsyncStorage.removeItem(PENDING_RECOVERY_STORAGE_KEY);
}

export async function getPendingRecovery(): Promise<PendingRecoveryState | null> {
  try {
    const raw = await readRawPendingRecovery();
    const pending = parsePendingRecovery(raw);

    if (!pending && raw) {
      await removeRawPendingRecovery();
    }

    return pending;
  } catch {
    return null;
  }
}

export async function savePendingRecovery(telefoneLimpo: string): Promise<void> {
  const pending: PendingRecoveryState = {
    telefoneLimpo,
    requestedAt: Date.now(),
  };

  try {
    await writeRawPendingRecovery(JSON.stringify(pending));
  } catch {
    // Falha local não deve bloquear o fluxo de recuperação.
  }
}

export async function clearPendingRecovery(): Promise<void> {
  try {
    await removeRawPendingRecovery();
  } catch {
    // Falha local não deve bloquear o fluxo de recuperação.
  }
}

export async function getResumablePendingRecovery(
  telefoneLimpo: string,
): Promise<PendingRecoveryState | null> {
  const normalizedPhone = telefoneLimpo.trim();

  if (normalizedPhone.length !== BRAZILIAN_MOBILE_PHONE_DIGITS) {
    return null;
  }

  const localPending = await getPendingRecovery();

  if (!localPending || localPending.telefoneLimpo !== normalizedPhone) {
    return null;
  }

  const { record, checked } = await consultarRecuperacaoPendente(normalizedPhone);

  if (!checked) {
    return null;
  }

  if (!record) {
    await clearPendingRecovery();
    return null;
  }

  return localPending;
}
