import type { Atividade } from '@/types/atividade';

export const TIPO_PROGRAMACAO_VALUES = ['mensalPorSemana', 'semanal', 'diaria'] as const;

export type TipoProgramacao = (typeof TIPO_PROGRAMACAO_VALUES)[number];

export const TIPO_PROGRAMACAO_OPTIONS: Array<{ value: TipoProgramacao; label: string }> = [
  { value: 'mensalPorSemana', label: 'Mensal por semana' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'diaria', label: 'Diária' },
];

export type AtividadeFormValues = {
  atividade: string;
  tipoProgramacao: TipoProgramacao | '';
  limiteReservasSemana: string;
  temUnidades: boolean;
  capacidade: string;
  horasAntes: string;
};

export type AtividadeFormFieldErrors = Partial<Record<keyof AtividadeFormValues, string>> & {
  general?: string;
};

export type UpdateAtividadePayload = {
  nome: string;
  tipoProgramacao: TipoProgramacao;
  limiteReservasSemana: number;
  temUnidades: boolean;
  capacidade: number;
  horasAntes: number;
};

function normalizeAtividadeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function parseIntegerField(value: string, label: string): { value: number | null; error?: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { value: 0 };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { value: null, error: `Informe um valor válido para ${label}.` };
  }

  return { value: parsed };
}

export function isTipoProgramacao(value: string): value is TipoProgramacao {
  return (TIPO_PROGRAMACAO_VALUES as readonly string[]).includes(value);
}

export function normalizeTipoProgramacao(value: string | null | undefined): TipoProgramacao | '' {
  const normalized = (value ?? '').trim();

  if (!normalized) {
    return '';
  }

  if (isTipoProgramacao(normalized)) {
    return normalized;
  }

  const compact = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  if (compact === 'mensalporsemana') {
    return 'mensalPorSemana';
  }

  if (compact === 'semanal') {
    return 'semanal';
  }

  if (compact === 'diaria') {
    return 'diaria';
  }

  return '';
}

export function getTipoProgramacaoLabel(value: TipoProgramacao | ''): string {
  return TIPO_PROGRAMACAO_OPTIONS.find((option) => option.value === value)?.label ?? '';
}

export function createAtividadeFormValuesFromRecord(record: Atividade): AtividadeFormValues {
  return {
    atividade: record.atividade,
    tipoProgramacao: normalizeTipoProgramacao(record.tipoProgramacao),
    limiteReservasSemana: String(record.limiteReservasSemana),
    temUnidades: record.temUnidades,
    capacidade: String(record.capacidade),
    horasAntes: String(record.horasAntes),
  };
}

export function validateAtividadeForm(values: AtividadeFormValues): AtividadeFormFieldErrors {
  const errors: AtividadeFormFieldErrors = {};
  const atividade = normalizeAtividadeName(values.atividade);

  if (!atividade) {
    errors.atividade = 'Informe o nome da atividade.';
  }

  if (!isTipoProgramacao(values.tipoProgramacao)) {
    errors.tipoProgramacao = 'Selecione o tipo de programação.';
  }

  const numericFields: Array<{ key: keyof AtividadeFormValues; label: string }> = [
    { key: 'limiteReservasSemana', label: 'limite de reservas por semana' },
    { key: 'capacidade', label: 'capacidade' },
    { key: 'horasAntes', label: 'horas antes' },
  ];

  for (const field of numericFields) {
    const rawValue = values[field.key];

    if (typeof rawValue !== 'string') {
      continue;
    }

    const parsed = parseIntegerField(rawValue, field.label);

    if (parsed.error) {
      errors[field.key] = parsed.error;
    }
  }

  return errors;
}

export function buildUpdateAtividadePayload(values: AtividadeFormValues): UpdateAtividadePayload {
  const tipoProgramacao = isTipoProgramacao(values.tipoProgramacao)
    ? values.tipoProgramacao
    : 'mensalPorSemana';
  const limiteReservasSemana =
    parseIntegerField(values.limiteReservasSemana, 'limite de reservas por semana').value ?? 0;
  const capacidade = parseIntegerField(values.capacidade, 'capacidade').value ?? 0;
  const horasAntes = parseIntegerField(values.horasAntes, 'horas antes').value ?? 0;

  return {
    nome: normalizeAtividadeName(values.atividade),
    tipoProgramacao,
    limiteReservasSemana,
    temUnidades: values.temUnidades,
    capacidade,
    horasAntes,
  };
}

export function hasAtividadeFormChanges(
  current: AtividadeFormValues,
  original: AtividadeFormValues,
): boolean {
  return (Object.keys(current) as Array<keyof AtividadeFormValues>).some(
    (key) => current[key] !== original[key],
  );
}
