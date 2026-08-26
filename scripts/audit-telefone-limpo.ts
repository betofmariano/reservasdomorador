/**
 * Relatório de inconsistências em users.telefoneLimpo.
 * Uso: npx tsx scripts/audit-telefone-limpo.ts
 *
 * Não altera dados — apenas diagnostica duplicatas, vazios e tamanhos inválidos.
 */

const API_BASE = 'https://x186-chcp-dg8s.n7.xano.io/api:FLyoOY3L';

type RawUser = {
  id?: number;
  nome?: string;
  telefoneLimpo?: string | null;
  telefone?: string | null;
  telefoneCorrigido?: string | null;
};

function normalizeDigits(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '');
}

function isValidBrazilPhone(digits: string): boolean {
  if (!digits) {
    return false;
  }

  const withoutCountry = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;

  return withoutCountry.length === 10 || withoutCountry.length === 11;
}

async function fetchUsers(): Promise<RawUser[]> {
  const response = await fetch(`${API_BASE}/users`);

  if (!response.ok) {
    throw new Error(`Falha ao buscar users: HTTP ${response.status}`);
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('Resposta inesperada de /users');
  }

  return data as RawUser[];
}

async function main() {
  const users = await fetchUsers();
  const empty: RawUser[] = [];
  const invalidLength: RawUser[] = [];
  const byPhone = new Map<string, RawUser[]>();

  for (const user of users) {
    const digits = normalizeDigits(user.telefoneLimpo);

    if (!digits) {
      empty.push(user);
      continue;
    }

    if (!isValidBrazilPhone(digits)) {
      invalidLength.push(user);
    }

    const bucket = byPhone.get(digits) ?? [];
    bucket.push(user);
    byPhone.set(digits, bucket);
  }

  const duplicates = [...byPhone.entries()].filter(([, items]) => items.length > 1);

  console.log('=== Auditoria telefoneLimpo ===');
  console.log('Total users:', users.length);
  console.log('Vazios/nulos:', empty.length);
  console.log('Tamanho inválido:', invalidLength.length);
  console.log('Duplicados:', duplicates.length);

  if (empty.length > 0) {
    console.log('\n-- Amostra vazios (max 10) --');
    for (const user of empty.slice(0, 10)) {
      console.log(`#${user.id} ${user.nome ?? ''}`);
    }
  }

  if (invalidLength.length > 0) {
    console.log('\n-- Amostra tamanho inválido (max 10) --');
    for (const user of invalidLength.slice(0, 10)) {
      console.log(
        `#${user.id} ${user.nome ?? ''} telefoneLimpo=${JSON.stringify(user.telefoneLimpo)}`,
      );
    }
  }

  if (duplicates.length > 0) {
    console.log('\n-- Duplicatas (max 10 telefones) --');
    for (const [phone, items] of duplicates.slice(0, 10)) {
      console.log(
        phone,
        '=>',
        items.map((item) => `#${item.id} ${item.nome ?? ''}`).join(' | '),
      );
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
