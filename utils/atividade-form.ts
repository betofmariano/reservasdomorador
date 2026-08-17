import type { Atividade } from '@/types/atividade';

export type AtividadeFormValues = {
  atividade: string;
  capacidade: string;
  controlePresenca: boolean;
  horasAntes: string;
  minutosCancelamento: string;
  observacao: string;
  tolerancia: string;
  qtdeHorarios: string;
  tipoProgramacao: string;
  checkinAntes: string;
  checkinDepois: string;
  checkinSeguro: boolean;
};

export type AtividadeFormFieldErrors = Partial<Record<keyof AtividadeFormValues, string>> & {
  general?: string;
};

export type UpdateAtividadePayload = {
  atividade: string;
  capacidade: number;
  controlePresenca: boolean;
  horasAntes: number;
  minutosCancelamento: number;
  observacao: string;
  tolerancia: number;
  qtdeHorarios: number;
  tipoProgramacao: string;
  checkinAntes: number;
  checkinDepois: number;
  checkinSeguro: boolean;
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

export function createAtividadeFormValuesFromRecord(record: Atividade): AtividadeFormValues {
  return {
    atividade: record.atividade,
    capacidade: String(record.capacidade),
    controlePresenca: record.controlePresenca,
    horasAntes: String(record.horasAntes),
    minutosCancelamento: String(record.minutosCancelamento),
    observacao: record.observacao,
    tolerancia: String(record.tolerancia),
    qtdeHorarios: String(record.qtdeHorarios),
    tipoProgramacao: record.tipoProgramacao,
    checkinAntes: String(record.checkinAntes),
    checkinDepois: String(record.checkinDepois),
    checkinSeguro: record.checkinSeguro,
  };
}

export function validateAtividadeForm(values: AtividadeFormValues): AtividadeFormFieldErrors {
  const errors: AtividadeFormFieldErrors = {};
  const atividade = normalizeAtividadeName(values.atividade);

  if (!atividade) {
    errors.atividade = 'Informe o nome da atividade.';
  }

  const numericFields: Array<{ key: keyof AtividadeFormValues; label: string }> = [
    { key: 'capacidade', label: 'capacidade' },
    { key: 'horasAntes', label: 'horas antes' },
    { key: 'minutosCancelamento', label: 'minutos de cancelamento' },
    { key: 'tolerancia', label: 'tolerância' },
    { key: 'qtdeHorarios', label: 'quantidade de horários' },
    { key: 'checkinAntes', label: 'check-in antes' },
    { key: 'checkinDepois', label: 'check-in depois' },
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
  const capacidade = parseIntegerField(values.capacidade, 'capacidade').value ?? 0;
  const horasAntes = parseIntegerField(values.horasAntes, 'horas antes').value ?? 0;
  const minutosCancelamento =
    parseIntegerField(values.minutosCancelamento, 'minutos de cancelamento').value ?? 0;
  const tolerancia = parseIntegerField(values.tolerancia, 'tolerância').value ?? 0;
  const qtdeHorarios = parseIntegerField(values.qtdeHorarios, 'quantidade de horários').value ?? 0;
  const checkinAntes = parseIntegerField(values.checkinAntes, 'check-in antes').value ?? 0;
  const checkinDepois = parseIntegerField(values.checkinDepois, 'check-in depois').value ?? 0;

  return {
    atividade: normalizeAtividadeName(values.atividade),
    capacidade,
    controlePresenca: values.controlePresenca,
    horasAntes,
    minutosCancelamento,
    observacao: values.observacao.trim(),
    tolerancia,
    qtdeHorarios,
    tipoProgramacao: values.tipoProgramacao.trim(),
    checkinAntes,
    checkinDepois,
    checkinSeguro: values.checkinSeguro,
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
