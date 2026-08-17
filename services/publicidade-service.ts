import {
  PUBLICIDADE_ENDPOINTS,
  XANO_PUBLICIDADE_API_BASE_URL,
} from '@/constants/api';
import {
  getRequestFromBaseUrl,
  postRequestFromBaseUrl,
} from '@/services/api-client';
import { resolveAcademiaNameById } from '@/services/solicitar-foto-alteracao-service';
import type {
  MostrarPubliXanoPayload,
  MostrarPubliXanoResponse,
  Patrocinador,
  PatrocinadoresResponse,
  PatrocinioUltimoVistoPayload,
  PublicidadeBanner,
} from '@/types/publicidade';
import type { User } from '@/types/user';
import type { PublicidadeDisplayOrigem } from '@/utils/publicidade-display';
import {
  buildImpressionStorageKey,
  clearStoredImpression,
  hasRecentStoredImpression,
  markStoredImpression,
} from '@/utils/publicidade-storage';

const PUBLICIDADE_APLICATIVO = 'MatchPlace';
const RECENT_IMPRESSION_DEDUPE_MS = 60_000;

const recentImpressions = new Map<string, number>();
const inFlightImpressions = new Set<string>();

function buildImpressionDedupeKey(
  userId: number,
  publicidadeId: number,
  display: PublicidadeDisplayOrigem,
): string {
  return `${userId}:${publicidadeId}:${display}`;
}

function shouldSkipDuplicateImpression(key: string, now: number = Date.now()): boolean {
  const lastRegisteredAt = recentImpressions.get(key);

  if (lastRegisteredAt !== undefined && now - lastRegisteredAt < RECENT_IMPRESSION_DEDUPE_MS) {
    return true;
  }

  recentImpressions.set(key, now);
  return false;
}

function buildPatrocinadorProximaTelaPath(usersId: number): string {
  const params = new URLSearchParams({
    users_id: String(usersId),
  });

  return `${PUBLICIDADE_ENDPOINTS.patrocinadorProximaTela}?${params.toString()}`;
}

export async function getPublicidadeBanner(): Promise<PublicidadeBanner> {
  return getRequestFromBaseUrl<PublicidadeBanner>(
    XANO_PUBLICIDADE_API_BASE_URL,
    PUBLICIDADE_ENDPOINTS.publicidadeBanner,
  );
}

export async function getPatrocinadores(): Promise<PatrocinadoresResponse> {
  return getRequestFromBaseUrl<PatrocinadoresResponse>(
    XANO_PUBLICIDADE_API_BASE_URL,
    PUBLICIDADE_ENDPOINTS.patrocinadores,
  );
}

export async function getPatrocinadorProximaTela(usersId: number): Promise<Patrocinador> {
  return getRequestFromBaseUrl<Patrocinador>(
    XANO_PUBLICIDADE_API_BASE_URL,
    buildPatrocinadorProximaTelaPath(usersId),
  );
}

export async function buildMostrarPubliXanoPayload(
  user: User,
  patrocinador: Patrocinador,
  display: PublicidadeDisplayOrigem,
): Promise<MostrarPubliXanoPayload> {
  const local = await resolveAcademiaNameById(user.academias_id);

  return {
    publicidade_id: patrocinador.id,
    users_id: user.id,
    nome: user.nome.trim(),
    publi: patrocinador.empresa.trim(),
    dataMostrada: Date.now(),
    aplicativo: PUBLICIDADE_APLICATIVO,
    local,
    display,
  };
}

export async function registrarMostrarPubliXano(
  payload: MostrarPubliXanoPayload,
): Promise<MostrarPubliXanoResponse> {
  return postRequestFromBaseUrl<MostrarPubliXanoResponse>(
    XANO_PUBLICIDADE_API_BASE_URL,
    PUBLICIDADE_ENDPOINTS.mostrarpublixano,
    payload,
  );
}

export async function getPatrocinioUltimoVisto(
  payload: PatrocinioUltimoVistoPayload,
): Promise<Patrocinador> {
  return postRequestFromBaseUrl<Patrocinador>(
    XANO_PUBLICIDADE_API_BASE_URL,
    PUBLICIDADE_ENDPOINTS.patrocinioUltimoVisto,
    payload,
  );
}

type RegistrarImpressaoBannerParams = {
  user: User;
  patrocinador: Patrocinador;
  display: PublicidadeDisplayOrigem;
};

export async function registrarImpressaoBanner({
  user,
  patrocinador,
  display,
}: RegistrarImpressaoBannerParams): Promise<void> {
  const dedupeKey = buildImpressionDedupeKey(user.id, patrocinador.id, display);
  const storageKey = buildImpressionStorageKey(user.id, patrocinador.id, display);

  if (
    shouldSkipDuplicateImpression(dedupeKey) ||
    inFlightImpressions.has(dedupeKey)
  ) {
    if (__DEV__) {
      console.log('Impressão duplicada ignorada em mostrarpublixano');
    }

    return;
  }

  if (await hasRecentStoredImpression(storageKey)) {
    if (__DEV__) {
      console.log('Impressão duplicada ignorada em mostrarpublixano (storage)');
    }

    return;
  }

  inFlightImpressions.add(dedupeKey);
  await markStoredImpression(storageKey);

  try {
    const payload = await buildMostrarPubliXanoPayload(user, patrocinador, display);
    await registrarMostrarPubliXano(payload);

    if (__DEV__) {
      console.log('Impressão registrada em mostrarpublixano');
    }
  } catch {
    recentImpressions.delete(dedupeKey);
    await clearStoredImpression(storageKey);

    if (__DEV__) {
      console.warn('Falha ao registrar mostrarpublixano');
    }
  } finally {
    inFlightImpressions.delete(dedupeKey);
  }
}
