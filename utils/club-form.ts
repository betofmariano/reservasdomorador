import type { ClubFormFieldErrors, ClubFormValues, CreateClubPayload } from '@/types/club';

const DEFAULT_HORA_INICIAL = 6;
const DEFAULT_HORA_FINAL = 22;
const DEFAULT_MINUTOS_DURACAO = 60;

export const CLUB_FORM_MESSAGES = {
  nome: 'Informe o nome do clube.',
  cidade: 'Informe a cidade.',
  estado: 'Informe o estado.',
  quadras: 'Informe uma quantidade de quadras válida.',
  general: 'Preencha corretamente os campos obrigatórios.',
  permission: 'Você não tem permissão para cadastrar clubes.',
  createError: 'Não foi possível cadastrar o clube. Tente novamente.',
  createSuccess: 'Clube cadastrado com sucesso.',
};

export function createInitialClubFormValues(): ClubFormValues {
  return {
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    quadras: '',
    minutosDuracao: '',
    horasLiberacao: '',
    intervaloJogos: '',
    minutosCancelamento: '',
    limiteCancelamento: '',
    limiteTrocaParceiros: '',
    jogoSimples: false,
    jogoDuplas: false,
    reservaUnica: false,
    cancelamentoAutomatico: false,
    respAdvUnicos: false,
    padraoDiario: false,
    exigeMatricula: false,
    ativo: true,
  };
}

function parseOptionalNonNegativeNumber(value: string): number {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : NaN;
}

function parseRequiredPositiveNumber(value: string): number {
  const parsed = parseOptionalNonNegativeNumber(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
}

export function validateClubForm(values: ClubFormValues): ClubFormFieldErrors {
  const errors: ClubFormFieldErrors = {};

  if (!values.nome.trim()) {
    errors.nome = CLUB_FORM_MESSAGES.nome;
  }

  if (!values.cidade.trim()) {
    errors.cidade = CLUB_FORM_MESSAGES.cidade;
  }

  const estado = values.estado.trim();

  if (!estado) {
    errors.estado = CLUB_FORM_MESSAGES.estado;
  } else if (estado.length > 2) {
    errors.estado = CLUB_FORM_MESSAGES.estado;
  }

  const quadras = parseRequiredPositiveNumber(values.quadras);

  if (!Number.isFinite(quadras)) {
    errors.quadras = CLUB_FORM_MESSAGES.quadras;
  }

  const numericFields: Array<{ key: keyof ClubFormValues; value: string }> = [
    { key: 'minutosDuracao', value: values.minutosDuracao },
    { key: 'horasLiberacao', value: values.horasLiberacao },
    { key: 'intervaloJogos', value: values.intervaloJogos },
    { key: 'minutosCancelamento', value: values.minutosCancelamento },
    { key: 'limiteCancelamento', value: values.limiteCancelamento },
    { key: 'limiteTrocaParceiros', value: values.limiteTrocaParceiros },
  ];

  for (const field of numericFields) {
    const trimmed = field.value.trim();

    if (!trimmed) {
      continue;
    }

    const parsed = parseOptionalNonNegativeNumber(field.value);

    if (!Number.isFinite(parsed)) {
      errors[field.key] = CLUB_FORM_MESSAGES.general;
    }
  }

  if (Object.keys(errors).length > 0) {
    errors.general = CLUB_FORM_MESSAGES.general;
  }

  return errors;
}

export function buildCreateClubPayload(values: ClubFormValues): CreateClubPayload {
  return {
    nome: values.nome.trim(),
    endereco: values.endereco.trim(),
    cidade: values.cidade.trim(),
    estado: values.estado.trim().toUpperCase(),
    jogoSimples: values.jogoSimples,
    jogoDuplas: values.jogoDuplas,
    horaInicial: DEFAULT_HORA_INICIAL,
    horaFinal: DEFAULT_HORA_FINAL,
    minutosDuracao: DEFAULT_MINUTOS_DURACAO,
    horasLiberacao: parseOptionalNonNegativeNumber(values.horasLiberacao),
    intervaloJogos: parseOptionalNonNegativeNumber(values.intervaloJogos),
    quadras: parseRequiredPositiveNumber(values.quadras),
    cancelamentoAutomatico: values.cancelamentoAutomatico,
    minutosCancelamento: parseOptionalNonNegativeNumber(values.minutosCancelamento),
    reservaUnica: values.reservaUnica,
    ativo: values.ativo,
    padraoDiario: values.padraoDiario,
    exigeMatricula: values.exigeMatricula,
    regulamento: '',
    respAdvUnicos: values.respAdvUnicos,
    limiteCancelamento: parseOptionalNonNegativeNumber(values.limiteCancelamento),
    limiteTrocaParceiros: parseOptionalNonNegativeNumber(values.limiteTrocaParceiros),
  };
}
