function normalizeVersionParts(version: string): number[] {
  const trimmed = version.trim();

  if (!trimmed) {
    return [0, 0, 0];
  }

  const parts = trimmed.split('.').map((part) => {
    const numeric = part.replace(/[^0-9].*$/, '');
    const parsed = Number.parseInt(numeric, 10);

    return Number.isFinite(parsed) ? parsed : 0;
  });

  while (parts.length < 3) {
    parts.push(0);
  }

  return parts;
}

export function compareVersions(currentVersion: string, remoteVersion: string): number {
  const currentParts = normalizeVersionParts(currentVersion);
  const remoteParts = normalizeVersionParts(remoteVersion);
  const length = Math.max(currentParts.length, remoteParts.length);

  for (let index = 0; index < length; index += 1) {
    const currentPart = currentParts[index] ?? 0;
    const remotePart = remoteParts[index] ?? 0;

    if (currentPart > remotePart) {
      return 1;
    }

    if (currentPart < remotePart) {
      return -1;
    }
  }

  return 0;
}

export function runCompareVersionTests(): void {
  const cases: Array<{ current: string; remote: string; expected: number }> = [
    { current: '1.0.2', remote: '1.0.2', expected: 0 },
    { current: '1.0.2', remote: '1.0.3', expected: -1 },
    { current: '1.0.9', remote: '1.1.0', expected: -1 },
    { current: '1.9.9', remote: '1.10.0', expected: -1 },
    { current: '1.99.99', remote: '2.0.0', expected: -1 },
    { current: '1.10.0', remote: '1.9.9', expected: 1 },
    { current: '1.0.3', remote: '1.0.2', expected: 1 },
  ];

  for (const testCase of cases) {
    const result = compareVersions(testCase.current, testCase.remote);

    if (result !== testCase.expected) {
      throw new Error(
        `compareVersions("${testCase.current}", "${testCase.remote}") expected ${testCase.expected}, got ${result}`,
      );
    }
  }
}
