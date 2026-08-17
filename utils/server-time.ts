let serverTimeOffsetMs = 0;

function parseServerDateHeader(value: string | null | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function syncServerTimeFromResponse(response: Response): void {
  const serverMs = parseServerDateHeader(response.headers.get('Date'));

  if (serverMs == null) {
    return;
  }

  serverTimeOffsetMs = serverMs - Date.now();
}

export function getServerNow(): number {
  return Date.now() + serverTimeOffsetMs;
}

export function getServerDate(): Date {
  return new Date(getServerNow());
}

export function resetServerTimeOffsetForTests(offsetMs = 0): void {
  serverTimeOffsetMs = offsetMs;
}

export function getServerTimeOffsetMs(): number {
  return serverTimeOffsetMs;
}
