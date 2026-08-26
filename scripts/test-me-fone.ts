/**
 * Testa GET /auth/me e compara com GET /getUser.
 *
 * Uso:
 *   set MATCHPLACE_AUTH_TOKEN=<token> && npx tsx scripts/test-me-fone.ts
 *   npx tsx scripts/test-me-fone.ts --login <telefoneLimpo> <password>
 */

import { normalizeUserFromApi } from '../utils/normalize-user';

const API_BASE = 'https://x186-chcp-dg8s.n7.xano.io/api:FLyoOY3L';

const LOCAL_ASSOCIATION_ROOT_KEYS = [
  'users_id',
  'gestor',
  'professor',
  'aprovado',
  'bloqueado',
  'ultimoAcesso',
  'socioTitulo',
  'dataRegulamento',
] as const;

type JsonRecord = Record<string, unknown>;

function extractAuthToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as JsonRecord;
  const candidates = [record.authToken, record.auth_token, record.token];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

async function login(telefoneLimpo: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/login-safe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telefoneLimpo, password }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Login falhou (HTTP ${response.status}): ${JSON.stringify(payload)}`);
  }

  const token = extractAuthToken(payload);

  if (!token) {
    throw new Error(`Login sem authToken: ${JSON.stringify(payload)}`);
  }

  return token;
}

async function fetchMeFone(token: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`me-fone falhou (HTTP ${response.status}): ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function fetchGetUser(usersId: number): Promise<unknown> {
  const response = await fetch(`${API_BASE}/getUser?users_id=${usersId}`);

  if (!response.ok) {
    throw new Error(`getUser falhou (HTTP ${response.status})`);
  }

  return response.json();
}

function looksLikeUsersLocalRoot(record: JsonRecord): boolean {
  return LOCAL_ASSOCIATION_ROOT_KEYS.some((key) => record[key] != null);
}

function resolveUsersId(record: JsonRecord): number | null {
  const nestedUsers = record._users;

  if (looksLikeUsersLocalRoot(record)) {
    if (nestedUsers && typeof nestedUsers === 'object') {
      const nestedId = (nestedUsers as JsonRecord).id;

      if (typeof nestedId === 'number' && Number.isFinite(nestedId)) {
        return nestedId;
      }
    }

    const usersId = record.users_id;

    if (typeof usersId === 'number' && Number.isFinite(usersId)) {
      return usersId;
    }
  }

  const rootId = record.id;

  if (typeof rootId === 'number' && Number.isFinite(rootId)) {
    return rootId;
  }

  return null;
}

function findLegacyRootIssues(record: JsonRecord): string[] {
  const issues: string[] = [];

  if (looksLikeUsersLocalRoot(record)) {
    issues.push('Raiz parece userslocal (campos locais expostos no me-fone).');
  }

  if (record._users != null) {
    issues.push('Campo _users aninhado (esperado users na raiz).');
  }

  for (const key of LOCAL_ASSOCIATION_ROOT_KEYS) {
    if (record[key] != null) {
      issues.push(`Campo local "${key}" não deveria estar na raiz.`);
    }
  }

  return issues;
}

function hasNestedUsersLocal(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const record = payload as JsonRecord;
  return record.usersLocal != null || record.userslocal != null;
}

function listRootKeys(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return Object.keys(payload as JsonRecord).sort();
}

function compareGlobalFields(meFone: JsonRecord, getUser: JsonRecord): string[] {
  const globalKeys = [
    'id',
    'nome',
    'telefoneLimpo',
    'administrador',
    'localPrioritario',
    'excluido',
    'telefoneIncorreto',
    'ultimaPublicidadeData',
  ] as const;

  const diffs: string[] = [];

  for (const key of globalKeys) {
    if (JSON.stringify(meFone[key]) !== JSON.stringify(getUser[key])) {
      diffs.push(`${key}: me-fone=${JSON.stringify(meFone[key])} getUser=${JSON.stringify(getUser[key])}`);
    }
  }

  return diffs;
}

async function main() {
  const args = process.argv.slice(2);
  let token: string | null = process.env.MATCHPLACE_AUTH_TOKEN?.trim() || null;

  if (args[0] === '--login') {
    const telefoneLimpo = args[1];
    const password = args[2];

    if (!telefoneLimpo || !password) {
      console.error('Uso: npx tsx scripts/test-me-fone.ts --login <telefoneLimpo> <password>');
      process.exit(1);
    }

    token = await login(telefoneLimpo, password);
    console.log('Login OK');
  } else if (args[0] && args[0] !== '--login') {
    token = args[0];
  }

  if (!token) {
    console.error('Defina MATCHPLACE_AUTH_TOKEN ou use --login <telefoneLimpo> <password>.');
    process.exit(1);
  }

  const meFonePayload = await fetchMeFone(token);
  const meFoneRecord =
    meFonePayload && typeof meFonePayload === 'object'
      ? (meFonePayload as JsonRecord)
      : {};

  const usersId = resolveUsersId(meFoneRecord);
  const legacyIssues = findLegacyRootIssues(meFoneRecord);

  console.log('\n=== GET /auth/me-fone ===');
  console.log(JSON.stringify(meFonePayload, null, 2));
  console.log('\nCampos raiz:', listRootKeys(meFonePayload).join(', '));

  if (hasNestedUsersLocal(meFonePayload)) {
    console.warn('\n⚠️  me-fone ainda inclui usersLocal/userslocal aninhado (legado).');
  } else {
    console.log('\n✓ Sem usersLocal aninhado na raiz.');
  }

  if (meFoneRecord.gestor != null || meFoneRecord.professor != null) {
    console.warn('⚠️  gestor/professor ainda presentes na raiz de me-fone (esperado em userslocal).');
  } else {
    console.log('✓ gestor/professor ausentes na raiz (esperado no modelo novo).');
  }

  if (legacyIssues.length > 0) {
    console.warn('\n⚠️  Formato legado detectado:');
    legacyIssues.forEach((issue) => console.warn(`  - ${issue}`));
  } else {
    console.log('\n✓ Formato raiz compatível com users global.');
  }

  const normalizedUser = normalizeUserFromApi(meFonePayload);
  console.log('\n=== normalizeUserFromApi (app) ===');
  console.log(
    JSON.stringify(
      {
        id: normalizedUser.id,
        nome: normalizedUser.nome,
        telefoneLimpo: normalizedUser.telefoneLimpo,
        administrador: normalizedUser.administrador,
        localPrioritario: normalizedUser.localPrioritario,
        excluido: normalizedUser.excluido,
        academias_id: normalizedUser.academias_id,
        gestor: normalizedUser.gestor,
        professor: normalizedUser.professor,
        aprovado: normalizedUser.aprovado,
      },
      null,
      2,
    ),
  );

  if (usersId != null) {
    const getUserPayload = await fetchGetUser(usersId);
    const getUserRecord =
      getUserPayload && typeof getUserPayload === 'object'
        ? (getUserPayload as JsonRecord)
        : {};

    console.log(`\n=== Comparação com GET /getUser?users_id=${usersId} ===`);
    const diffs = compareGlobalFields(meFoneRecord, getUserRecord);

    if (diffs.length === 0) {
      console.log('✓ Campos globais alinhados com getUser.');
    } else {
      console.log('Diferenças:');
      diffs.forEach((line) => console.log(`  - ${line}`));
    }
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
