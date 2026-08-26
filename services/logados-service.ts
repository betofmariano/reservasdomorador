import { Dimensions } from 'react-native';

import { stripNonNumeric } from '@/constants/auth';
import { API_ENDPOINTS } from '@/constants/api';
import { getMe } from '@/services/auth-service';
import { getAcademias } from '@/services/academias-service';
import { authDeleteRequest, authGetRequest, authPostRequest } from '@/services/api-client';
import { loadUserContextRecords } from '@/services/user-context-service';
import type { Academia } from '@/types/academia';
import type { LogadoPayload, LogadoRecord, LogadoResponse, LogadosResponse } from '@/types/logado';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import { getDeviceRegistrationInfo } from '@/utils/device-info';
import {
  enrichLogadosWithAcademiaNames,
  normalizeLogadoFromApi,
  normalizeLogadosFromApi,
} from '@/utils/normalize-logado';
import { normalizeRecordId } from '@/utils/normalize-api-fields';
import { buildUserContextPermissions } from '@/utils/user-context-permissions';
import { findUserLocalAssociation } from '@/utils/user-local-validation';
import { resolveEffectiveLocalRoles } from '@/utils/user-local-roles';

export type LogadoRegistrationContext = {
  academiasId: number;
  aprovado: boolean;
  gestor: boolean;
  bloqueado: boolean;
};

type ResolvedAuthenticatedLogadoContext = {
  user: User;
  registration: LogadoRegistrationContext;
};

let lastRegisteredLogadoKey: string | null = null;

export function resetLogadoRegistrationSession(): void {
  lastRegisteredLogadoKey = null;
}

function resolveSessionAcademiasId(
  user: User,
  associations: UserLocalAssociation[],
  sessionAcademiasId?: number | null,
): number | null {
  const candidates = [
    sessionAcademiasId,
    user.localPrioritario,
    user.academias_id,
    associations.length === 1 ? associations[0]?.academias_id : null,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeRecordId(candidate);

    if (normalized != null && normalized > 0) {
      return normalized;
    }
  }

  return null;
}

function buildLogadoRegistrationFromAssociation(
  user: User,
  association: UserLocalAssociation,
  currentAcademia: Academia | null,
): LogadoRegistrationContext {
  const permissions = buildUserContextPermissions(user, association, {
    currentAcademia,
  });

  return {
    academiasId: association.academias_id,
    aprovado: association.aprovado,
    gestor: permissions.gestor,
    bloqueado: association.bloqueado,
  };
}

function buildLogadoRegistrationFromMeFoneUser(user: User): LogadoRegistrationContext | null {
  const academiasId = normalizeRecordId(user.academias_id);

  if (academiasId == null || academiasId <= 0) {
    return null;
  }

  const { gestor } = resolveEffectiveLocalRoles({
    gestor: user.gestor,
    professor: user.professor === true,
  });

  return {
    academiasId,
    aprovado: user.aprovado === true,
    gestor: user.administrador ? user.gestor === true : gestor,
    bloqueado: user.bloqueado === true,
  };
}

export async function resolveLogadoRegistrationFromAuthenticatedContext(
  authToken: string,
  sessionAcademiasId?: number | null,
): Promise<ResolvedAuthenticatedLogadoContext | null> {
  const user = await getMe(authToken);

  let associations: UserLocalAssociation[] = [];
  let academias: Awaited<ReturnType<typeof getAcademias>> = [];

  try {
    const records = await loadUserContextRecords(user, authToken);
    associations = records.associations;
    academias = records.academias;
  } catch {
    // /auth/me-fone já traz o userslocal autenticado; segue com fallback.
  }

  const resolvedAcademiasId = resolveSessionAcademiasId(user, associations, sessionAcademiasId);
  const association =
    resolvedAcademiasId != null
      ? findUserLocalAssociation(associations, resolvedAcademiasId)
      : null;

  if (association) {
    const currentAcademia =
      academias.find((academia) => academia.id === association.academias_id) ?? null;

    return {
      user,
      registration: buildLogadoRegistrationFromAssociation(user, association, currentAcademia),
    };
  }

  const fallback = buildLogadoRegistrationFromMeFoneUser(user);

  if (!fallback) {
    return null;
  }

  return { user, registration: fallback };
}

export function buildLogadoPayload(
  user: User,
  pageWidth: number,
  registration: LogadoRegistrationContext,
): LogadoPayload {
  const telefoneLimpo =
    stripNonNumeric(user.telefoneLimpo ?? '') ||
    stripNonNumeric(user.telefoneConfirmado ?? '') ||
    '';

  const { plataforma, dispositivo } = getDeviceRegistrationInfo();

  return {
    users_id: user.id,
    created_at: Date.now(),
    nome: user.nome,
    email: user.email ?? '',
    academias_id: registration.academiasId,
    aprovado: registration.aprovado,
    gestor: registration.gestor,
    administrador: user.administrador === true,
    bloqueado: registration.bloqueado,
    larguraPagina: Math.round(pageWidth),
    telefoneLimpo,
    plataforma,
    dispositivo,
  };
}

function resolveLogadoPageWidth(pageWidth?: number): number {
  if (pageWidth != null && pageWidth > 0) {
    return Math.round(pageWidth);
  }

  return Math.round(Dimensions.get('window').width);
}

export async function registerLogadoForAuthenticatedUser(
  _authToken: string,
  _options?: {
    pageWidth?: number;
    sessionAcademiasId?: number | null;
    force?: boolean;
  },
): Promise<void> {
  // Contrato de POST /logados ainda usa academias_id; desativado para não bloquear o login.
}

export async function registrarLogado(
  payload: LogadoPayload,
  authToken: string,
): Promise<LogadoResponse> {
  if (__DEV__) {
    console.log('Payload /logados (login):', {
      users_id: payload.users_id,
      created_at: payload.created_at,
      telefoneLimpo: payload.telefoneLimpo,
      plataforma: payload.plataforma,
      dispositivo: payload.dispositivo,
      academias_id: payload.academias_id,
      aprovado: payload.aprovado,
      gestor: payload.gestor,
      bloqueado: payload.bloqueado,
    });
  }

  return authPostRequest<LogadoResponse>(API_ENDPOINTS.logados, authToken, payload);
}

export function buildLogadoDeletePath(logadoId: number): string {
  return `${API_ENDPOINTS.logados}/${logadoId}`;
}

export function normalizeLogadoRecord(raw: LogadoRecord): LogadoRecord {
  return normalizeLogadoFromApi(raw) ?? raw;
}

export async function getLogados(authToken: string): Promise<LogadosResponse> {
  const payload = await authGetRequest<unknown>(API_ENDPOINTS.logados, authToken);
  const logados = normalizeLogadosFromApi(payload);
  const academias = await getAcademias();
  const enriched = enrichLogadosWithAcademiaNames(logados, academias);

  console.log('Quantidade recebida:', enriched.length);

  return enriched;
}

export async function deleteLogado(
  logadoId: number,
  authToken: string,
): Promise<LogadoRecord | null> {
  return authDeleteRequest<LogadoRecord | null>(buildLogadoDeletePath(logadoId), authToken);
}
