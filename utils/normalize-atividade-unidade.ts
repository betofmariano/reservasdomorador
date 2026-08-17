import type { AtividadeUnidade } from '@/types/atividade-unidade';
import { normalizeRecordId, readString } from '@/utils/normalize-api-fields';

function readUnidadeLabel(record: Record<string, unknown>): string {
  return readString(record, [
    'unidade',
    'nome',
    'nomeSistema',
    'nome_sistema',
    'referencia',
  ]).trim();
}

export function normalizeAtividadeUnidadeFromApi(raw: unknown): AtividadeUnidade | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);
  const atividadesId = normalizeRecordId(record.atividades_id ?? record.atividade_id);

  if (id == null || atividadesId == null) {
    return null;
  }

  const unidade = readUnidadeLabel(record);

  return {
    id,
    atividades_id: atividadesId,
    unidade: unidade || `Unidade ${id}`,
    descricao: readString(record, ['descricao', 'descrição', 'descricaoUnidade']).trim(),
  };
}

export function normalizeAtividadeUnidadesFromApi(raw: unknown): AtividadeUnidade[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => normalizeAtividadeUnidadeFromApi(item))
    .filter((item): item is AtividadeUnidade => item !== null)
    .sort((a, b) => a.unidade.localeCompare(b.unidade, 'pt-BR'));
}

export function readAtividadeUnidadeNomeFromMapRecord(record: Record<string, unknown>): string | null {
  const nested =
    record._atividadeunidade ??
    record._atividadeUnidade ??
    record.atividadeunidade ??
    record.atividadeUnidade;

  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    const unidade = readUnidadeLabel(nestedRecord);

    if (unidade) {
      return unidade;
    }

    const descricao = readString(nestedRecord, ['descricao', 'descrição']).trim();

    if (descricao) {
      return descricao;
    }
  }

  const direct = readString(record, [
    'unidade',
    'atividadeUnidadeNome',
    'unidadeNome',
    'nomeUnidade',
    'atividadeunidade_nome',
  ]).trim();

  return direct || null;
}

export function readAtividadeUnidadeIdFromMapRecord(record: Record<string, unknown>): number | null {
  const id = normalizeRecordId(
    record.atividadeunidade_id ??
      record.atividadeUnidade_id ??
      record.atividadeunidadeId ??
      record.atividadeUnidadeId,
  );

  if (id == null || id <= 0) {
    return null;
  }

  return id;
}
