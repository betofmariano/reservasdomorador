export const PUBLICIDADE_VIEW_INTERVAL_MS = 15 * 60 * 1000;
export const PUBLICIDADE_DISPLAY_DURATION_MS = 5_000;
export const PUBLICIDADE_COUNTDOWN_SECONDS = 5;

export function shouldShowAdvertisement(
  lastViewedAt: number | null,
  now: number = Date.now(),
): boolean {
  if (lastViewedAt === null) {
    return true;
  }

  return now - lastViewedAt >= PUBLICIDADE_VIEW_INTERVAL_MS;
}

export function normalizeUltimaPublicidadeData(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function getEffectiveLastAdvertisementViewAt(
  localLastViewedAt: number | null,
  serverLastViewedAt: number | null,
): number | null {
  if (localLastViewedAt === null) {
    return serverLastViewedAt;
  }

  if (serverLastViewedAt === null) {
    return localLastViewedAt;
  }

  return Math.max(localLastViewedAt, serverLastViewedAt);
}
