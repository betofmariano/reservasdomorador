import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type {
  AlunoMapaFrequencia,
  ColunaMapaFrequencia,
  FrequenciaRegistroApi,
  FrequenciaStatus,
  HorarioMapaFrequenciaOption,
  MapaFrequenciaKey,
  MapaFrequenciaRelatorio,
} from '@/types/mapa-frequencia';
import { MAPA_FREQUENCIA_KEYS } from '@/types/mapa-frequencia';
import type { Horario } from '@/types/horario';
import { formatHorarioHHmm, horariosMatchTime, sortHorariosByTime } from '@/utils/horario-format';
import { normalizeRecordId, readString, readTimestamp } from '@/utils/normalize-api-fields';
import { normalizeSearchText } from '@/utils/search-text';

function readMapaNumber(record: Record<string, unknown>, key: MapaFrequenciaKey): number {
  const value = record[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return 0;
}

export function normalizeFrequenciaRegistroFromApi(raw: unknown): FrequenciaRegistroApi | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = normalizeRecordId(record.id);
  const atividadesId = normalizeRecordId(record.atividades_id);
  const academiasId = normalizeRecordId(record.academias_id);

  if (id == null || atividadesId == null || academiasId == null) {
    return null;
  }

  const mapas = MAPA_FREQUENCIA_KEYS.reduce(
    (acc, key) => {
      acc[key] = readMapaNumber(record, key);
      return acc;
    },
    {} as Record<MapaFrequenciaKey, number>,
  );

  return {
    id,
    created_at: readTimestamp(record, ['created_at']) ?? 0,
    atividades_id: atividadesId,
    academias_id: academiasId,
    nome: readString(record, ['nome']),
    users_id: normalizeRecordId(record.users_id) ?? 0,
    ...mapas,
  };
}

export function normalizeFrequenciaListFromApi(raw: unknown): FrequenciaRegistroApi[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeFrequenciaRegistroFromApi(item))
      .filter((item): item is FrequenciaRegistroApi => item !== null);
  }

  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const nested = record.items ?? record.frequencia ?? record.data;

    if (nested != null) {
      return normalizeFrequenciaListFromApi(nested);
    }

    const item = normalizeFrequenciaRegistroFromApi(raw);
    return item ? [item] : [];
  }

  return [];
}

export function isFrequenciaHeaderRow(item: FrequenciaRegistroApi): boolean {
  return !item.nome || item.nome.trim() === '';
}

export function formatarCabecalhoMapaFrequencia(dataAtividade: number | null | undefined): {
  dataFormatada: string;
  horaFormatada: string;
} {
  if (dataAtividade == null || !Number.isFinite(dataAtividade) || dataAtividade <= 0) {
    return { dataFormatada: '—', horaFormatada: '—' };
  }

  let timestamp = dataAtividade;

  if (timestamp < 1_000_000_000_000) {
    timestamp *= 1000;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return { dataFormatada: '—', horaFormatada: '—' };
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    dataFormatada: `${day}/${month}`,
    horaFormatada: `${hours}:${minutes}`,
  };
}

function normalizeFrequenciaStatus(value: number): FrequenciaStatus {
  if (value === 1 || value === 3) {
    return value;
  }

  if (__DEV__ && value !== 0 && value !== 2) {
    console.warn('[MapaFrequencia] Status desconhecido:', value);
  }

  return null;
}

function resolveMapaDiarioTimestamp(item: MapaDiarioFuturoItem | null | undefined): number | null {
  if (!item || item.dataAtividade <= 0) {
    return null;
  }

  return item.dataAtividade;
}

export function mapHorariosToMapaFrequenciaOptions(horarios: Horario[]): HorarioMapaFrequenciaOption[] {
  const unique = new Map<string, HorarioMapaFrequenciaOption>();

  for (const horario of sortHorariosByTime(horarios)) {
    const key = `${horario.hora}:${horario.minutos}`;

    if (!unique.has(key)) {
      unique.set(key, {
        id: horario.id,
        label: formatHorarioHHmm(horario.hora, horario.minutos),
        hora: horario.hora,
        minutos: horario.minutos,
      });
    }
  }

  const specificHorarios = Array.from(unique.values());

  return [
    {
      id: null,
      label: 'Todos os horários',
      hora: null,
      minutos: null,
    },
    ...specificHorarios,
  ];
}

export function hasSpecificHorariosCadastrados(
  horarios: HorarioMapaFrequenciaOption[],
): boolean {
  return horarios.some((item) => item.hora != null && item.minutos != null);
}

export function getDefaultHorarioMapaFrequencia(
  horarios: HorarioMapaFrequenciaOption[],
): HorarioMapaFrequenciaOption {
  return (
    horarios.find((item) => item.hora == null && item.minutos == null) ??
    horarios[0] ?? {
      id: null,
      label: 'Todos os horários',
      hora: null,
      minutos: null,
    }
  );
}

export function buildMapaFrequenciaMontagemQuery(
  academiasId: number,
  horario: HorarioMapaFrequenciaOption | null,
) {
  const query: {
    academias_id: number;
    horarios_id?: number;
    hora?: number;
    minutos?: number;
  } = {
    academias_id: academiasId,
  };

  if (horario?.id != null) {
    query.horarios_id = horario.id;
  }

  if (horario?.hora != null && horario.minutos != null) {
    query.hora = horario.hora;
    query.minutos = horario.minutos;
  }

  return query;
}

export function buildMapaFrequenciaPostBody(
  atividadesId: number,
  academiasId: number,
  horario: HorarioMapaFrequenciaOption | null,
) {
  return {
    atividades_id: atividadesId,
    ...buildMapaFrequenciaMontagemQuery(academiasId, horario),
  };
}

export function resolveMapaFrequenciaApiError(
  error: unknown,
  etapa: 'excluir' | 'inicializar' | 'montar' | 'carregar' = 'montar',
): string {
  const rawMessage =
    error instanceof Error ? error.message : 'Não foi possível montar o Mapa de Frequência.';

  if (rawMessage.includes('listaMapas')) {
    return 'Não foi possível montar o Mapa de Frequência para esta combinação de atividade e horário. Selecione um horário específico (por exemplo, 08:00) e confirme novamente. Se o erro continuar, pode ser necessário ajuste no Xano ou existir histórico insuficiente de aulas anteriores.';
  }

  if (rawMessage.includes('aulas anteriores')) {
    return rawMessage;
  }

  if (etapa === 'excluir') {
    return 'Não foi possível preparar o Mapa de Frequência.';
  }

  if (etapa === 'inicializar') {
    return 'Não foi possível gerar a estrutura inicial do Mapa de Frequência.';
  }

  if (etapa === 'carregar') {
    return 'Não foi possível carregar os dados do Mapa de Frequência.';
  }

  if (rawMessage.includes('cabeçalho')) {
    return 'Não foi possível identificar o cabeçalho do Mapa de Frequência.';
  }

  return rawMessage.includes('Mapa de Frequência')
    ? rawMessage
    : 'Não foi possível montar o Mapa de Frequência.';
}

type SelecionarMapaDiarioIdsParams = {
  academiasId: number;
  atividadesId: number;
  horario: HorarioMapaFrequenciaOption | null;
  now?: number;
};

/** Replica a lógica do Bubble: mapa1..10 = últimas 10 aulas passadas da atividade/horário. */
export function selecionarIdsMapaDiarioParaFrequencia(
  items: MapaDiarioFuturoItem[],
  params: SelecionarMapaDiarioIdsParams,
): number[] {
  const now = params.now ?? Date.now();

  const filtered = items.filter((item) => {
    if (item.academias_id !== params.academiasId) {
      return false;
    }

    if (item.atividades_id !== params.atividadesId) {
      return false;
    }

    if (item.dataAtividade <= 0 || item.dataAtividade >= now) {
      return false;
    }

    if (params.horario?.hora != null && params.horario.minutos != null) {
      return horariosMatchTime(item, {
        hora: params.horario.hora,
        minutos: params.horario.minutos,
      });
    }

    return true;
  });

  const sorted = filtered.sort((a, b) => b.dataAtividade - a.dataAtividade);
  const ids = sorted.slice(0, MAPA_FREQUENCIA_KEYS.length).map((item) => item.id);

  while (ids.length < MAPA_FREQUENCIA_KEYS.length) {
    ids.push(0);
  }

  return ids;
}

export function buildFrequenciaCabecalhoMapasPayload(
  header: FrequenciaRegistroApi,
  mapaDiarioIds: number[],
): FrequenciaRegistroApi {
  const mapas = MAPA_FREQUENCIA_KEYS.reduce(
    (acc, key, index) => {
      acc[key] = mapaDiarioIds[index] ?? 0;
      return acc;
    },
    {} as Record<MapaFrequenciaKey, number>,
  );

  return {
    ...header,
    ...mapas,
  };
}

export function buildMapaDiarioLookup(
  items: MapaDiarioFuturoItem[],
): Map<number, MapaDiarioFuturoItem> {
  const lookup = new Map<number, MapaDiarioFuturoItem>();

  for (const item of items) {
    lookup.set(item.id, item);
  }

  return lookup;
}

type MontarMapaFrequenciaInput = {
  registros: FrequenciaRegistroApi[];
  atividadeId: number;
  atividadeNome: string;
  horario: HorarioMapaFrequenciaOption | null;
  mapaDiarioById: Map<number, MapaDiarioFuturoItem>;
};

export function montarMapaFrequenciaRelatorio(
  input: MontarMapaFrequenciaInput,
): MapaFrequenciaRelatorio {
  const filtrados = input.registros.filter((item) => item.atividades_id === input.atividadeId);
  const header = filtrados.find(isFrequenciaHeaderRow);

  if (!header) {
    throw new Error('Não foi possível identificar o cabeçalho do Mapa de Frequência.');
  }

  const colunas: ColunaMapaFrequencia[] = [];

  for (const chave of MAPA_FREQUENCIA_KEYS) {
    const mapaDiarioId = header[chave];

    if (!mapaDiarioId || mapaDiarioId <= 0) {
      continue;
    }

    const mapaDiario = input.mapaDiarioById.get(mapaDiarioId) ?? null;

    if (
      input.horario?.hora != null &&
      input.horario.minutos != null &&
      mapaDiario &&
      !horariosMatchTime(mapaDiario, {
        hora: input.horario.hora,
        minutos: input.horario.minutos,
      })
    ) {
      continue;
    }

    const dataAtividade = resolveMapaDiarioTimestamp(mapaDiario);
    const { dataFormatada, horaFormatada } = formatarCabecalhoMapaFrequencia(dataAtividade);

    colunas.push({
      chave,
      mapaDiarioId,
      dataAtividade,
      dataFormatada,
      horaFormatada,
    });
  }

  const alunos = filtrados
    .filter((item) => !isFrequenciaHeaderRow(item))
    .map((item) => ({
      id: item.id,
      users_id: item.users_id,
      nome: item.nome.trim(),
      statuses: MAPA_FREQUENCIA_KEYS.reduce(
        (acc, key) => {
          acc[key] = normalizeFrequenciaStatus(item[key]);
          return acc;
        },
        {} as Record<MapaFrequenciaKey, FrequenciaStatus>,
      ),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));

  return {
    atividadeId: input.atividadeId,
    atividadeNome: input.atividadeNome,
    horarioId: input.horario?.id ?? null,
    horarioFormatado:
      input.horario?.hora != null && input.horario.minutos != null
        ? formatHorarioHHmm(input.horario.hora, input.horario.minutos)
        : null,
    colunas,
    alunos,
  };
}

export function filterAlunosMapaFrequenciaByNome(
  alunos: AlunoMapaFrequencia[],
  filtro: string,
): AlunoMapaFrequencia[] {
  const query = normalizeSearchText(filtro).replace(/\s+/g, ' ');

  if (!query) {
    return alunos;
  }

  return alunos.filter((aluno) => normalizeSearchText(aluno.nome).includes(query));
}

export function getFrequenciaStatusLabel(status: FrequenciaStatus): string {
  switch (status) {
    case 1:
      return 'Reservou e compareceu';
    case 3:
      return 'Reservou e não compareceu';
    default:
      return 'Reserva Não Realizada';
  }
}

export function getMapaFrequenciaPdfCellFillColor(status: FrequenciaStatus): [number, number, number] {
  switch (status) {
    case 1:
      return [34, 160, 107];
    case 3:
      return [17, 17, 17];
    default:
      return [255, 255, 255];
  }
}

export function getMapaFrequenciaPdfCellBorderColor(status: FrequenciaStatus): [number, number, number] {
  switch (status) {
    case 1:
      return [34, 160, 107];
    case 3:
      return [17, 17, 17];
    default:
      return [197, 197, 197];
  }
}
