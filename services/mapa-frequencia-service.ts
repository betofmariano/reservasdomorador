import {
  API_ENDPOINTS,
  buildExcluirFrequenciaPath,
  buildFrequenciaItemPath,
  buildVerFrequenciaPath,
} from '@/constants/api';
import type { MapaFrequenciaMontagemQuery } from '@/constants/api';
import { authGetRequest, authPatchRequest, authPostRequest } from '@/services/api-client';
import { getMapaDiarioAtividadeHorarios } from '@/services/mapa-diario-service';
import type { MapaDiarioFuturoItem } from '@/types/mapa-diario-futuro';
import type { HorarioMapaFrequenciaOption, MapaFrequenciaRelatorio } from '@/types/mapa-frequencia';
import type { FrequenciaRegistroApi } from '@/types/mapa-frequencia';
import {
  buildFrequenciaCabecalhoMapasPayload,
  buildMapaDiarioLookup,
  buildMapaFrequenciaMontagemQuery,
  buildMapaFrequenciaPostBody,
  montarMapaFrequenciaRelatorio,
  normalizeFrequenciaListFromApi,
  resolveMapaFrequenciaApiError,
  selecionarIdsMapaDiarioParaFrequencia,
} from '@/utils/mapa-frequencia';

export async function excluirFrequenciaAtividade(
  atividadesId: number,
  authToken: string,
  query?: MapaFrequenciaMontagemQuery,
): Promise<unknown> {
  return authGetRequest<unknown>(buildExcluirFrequenciaPath(atividadesId, query), authToken);
}

export async function verFrequenciaAtividade(
  atividadesId: number,
  authToken: string,
  query?: MapaFrequenciaMontagemQuery,
): Promise<unknown> {
  return authGetRequest<unknown>(buildVerFrequenciaPath(atividadesId, query), authToken);
}

export async function getFrequenciaRegistros(authToken: string): Promise<FrequenciaRegistroApi[]> {
  const data = await authGetRequest<unknown>(API_ENDPOINTS.frequencia, authToken);
  return normalizeFrequenciaListFromApi(data);
}

export async function criarCabecalhoFrequenciaEmBranco(
  atividadesId: number,
  academiasId: number,
  horario: HorarioMapaFrequenciaOption | null,
  authToken: string,
): Promise<FrequenciaRegistroApi> {
  const body = buildMapaFrequenciaPostBody(atividadesId, academiasId, horario);
  const data = await authPostRequest<unknown>(API_ENDPOINTS.frequencia, authToken, body);
  const [registro] = normalizeFrequenciaListFromApi(data);

  if (!registro) {
    throw new Error('Não foi possível gerar a estrutura inicial do Mapa de Frequência.');
  }

  return registro;
}

export async function preencherCabecalhoFrequenciaComMapaDiario(
  header: FrequenciaRegistroApi,
  academiasId: number,
  atividadeId: number,
  horario: HorarioMapaFrequenciaOption | null,
  mapaDiarioItems: MapaDiarioFuturoItem[],
  authToken: string,
): Promise<FrequenciaRegistroApi> {
  const mapaDiarioIds = selecionarIdsMapaDiarioParaFrequencia(mapaDiarioItems, {
    academiasId,
    atividadesId: atividadeId,
    horario,
  });

  if (!mapaDiarioIds.some((id) => id > 0)) {
    throw new Error(
      'Não há aulas anteriores registradas para montar o Mapa de Frequência desta atividade e horário.',
    );
  }

  const payload = buildFrequenciaCabecalhoMapasPayload(header, mapaDiarioIds);
  const data = await authPatchRequest<unknown>(
    buildFrequenciaItemPath(header.id),
    authToken,
    payload,
  );
  const [registro] = normalizeFrequenciaListFromApi(data);

  return registro ?? payload;
}

export async function getFrequenciaRegistrosByAtividade(
  atividadesId: number,
  authToken: string,
): Promise<FrequenciaRegistroApi[]> {
  const registros = await getFrequenciaRegistros(authToken);
  return registros.filter((item) => item.atividades_id === atividadesId);
}

type GerarMapaFrequenciaParams = {
  academiasId: number;
  atividadeId: number;
  atividadeNome: string;
  horario: HorarioMapaFrequenciaOption | null;
  authToken: string;
  onEtapa?: (etapa: 'excluir' | 'inicializar' | 'montar' | 'carregar' | 'processar') => void;
};

export async function gerarMapaFrequencia({
  academiasId,
  atividadeId,
  atividadeNome,
  horario,
  authToken,
  onEtapa,
}: GerarMapaFrequenciaParams): Promise<MapaFrequenciaRelatorio> {
  const montagemQuery = buildMapaFrequenciaMontagemQuery(academiasId, horario);

  onEtapa?.('excluir');
  await excluirFrequenciaAtividade(atividadeId, authToken, montagemQuery);

  onEtapa?.('inicializar');
  let header: FrequenciaRegistroApi;

  try {
    header = await criarCabecalhoFrequenciaEmBranco(atividadeId, academiasId, horario, authToken);
  } catch (error) {
    throw new Error(resolveMapaFrequenciaApiError(error, 'inicializar'));
  }

  onEtapa?.('montar');
  let mapaDiarioItems: MapaDiarioFuturoItem[];

  try {
    mapaDiarioItems = await getMapaDiarioAtividadeHorarios(academiasId, authToken);
    await preencherCabecalhoFrequenciaComMapaDiario(
      header,
      academiasId,
      atividadeId,
      horario,
      mapaDiarioItems,
      authToken,
    );
    await verFrequenciaAtividade(atividadeId, authToken, montagemQuery);
  } catch (error) {
    throw new Error(resolveMapaFrequenciaApiError(error, 'montar'));
  }

  onEtapa?.('carregar');
  let registros: FrequenciaRegistroApi[];

  try {
    registros = await getFrequenciaRegistrosByAtividade(atividadeId, authToken);
  } catch (error) {
    throw new Error(resolveMapaFrequenciaApiError(error, 'carregar'));
  }

  onEtapa?.('processar');
  const mapaDiarioById = buildMapaDiarioLookup(mapaDiarioItems);

  return montarMapaFrequenciaRelatorio({
    registros,
    atividadeId,
    atividadeNome,
    horario,
    mapaDiarioById,
  });
}
