import { API_ENDPOINTS } from '@/constants/api';
import { getAcademias } from '@/services/academias-service';
import { getAllUsuariosLocal } from '@/services/usuarios-service';
import { authDeleteRequest, authGetRequest } from '@/services/api-client';
import type { Acesso, AcessosResponse } from '@/types/acesso';
import { filterAcessosWithLogin, filterAcessosWithoutLogin } from '@/utils/acesso-format';
import {
  buildUsersByIdMap,
  enrichAcessosWithAcademiaNames,
  enrichAcessosWithUserDetails,
  normalizeAcessosFromApi,
} from '@/utils/normalize-acesso';

export function buildAcessoDeletePath(acessoId: number): string {
  return `${API_ENDPOINTS.acessos}/${acessoId}`;
}

async function fetchAcessosRaw(authToken: string): Promise<AcessosResponse> {
  const payload = await authGetRequest<unknown>(API_ENDPOINTS.acessos, authToken);
  const acessos = normalizeAcessosFromApi(payload);
  const [academias, usersLocal] = await Promise.all([
    getAcademias(),
    getAllUsuariosLocal(authToken),
  ]);
  const usersById = buildUsersByIdMap(usersLocal);

  return enrichAcessosWithUserDetails(
    enrichAcessosWithAcademiaNames(acessos, academias),
    usersById,
  );
}

export async function getAcessos(authToken: string): Promise<AcessosResponse> {
  const data = await fetchAcessosRaw(authToken);

  console.log('Quantidade recebida:', data.length);

  const filtered = filterAcessosWithoutLogin(data);

  console.log('Quantidade após remover Login/PIN:', filtered.length);

  return filtered;
}

export async function getAcessosLogins(authToken: string): Promise<AcessosResponse> {
  const data = await fetchAcessosRaw(authToken);

  console.log('Quantidade recebida:', data.length);

  const filtered = filterAcessosWithLogin(data);

  console.log('Quantidade após manter Login/PIN:', filtered.length);

  return filtered;
}

export async function deleteAcesso(
  acessoId: number,
  authToken: string,
): Promise<Acesso | null> {
  return authDeleteRequest<Acesso | null>(buildAcessoDeletePath(acessoId), authToken);
}

export type AcessosApagarResponse = Record<string, unknown>;

export async function apagarAcessos24Horas(authToken: string): Promise<AcessosApagarResponse> {
  console.log('Limpeza de acessos anteriores às últimas 24 horas solicitada');

  const data = await authGetRequest<AcessosApagarResponse>(
    API_ENDPOINTS.acessosApagar,
    authToken,
  );

  console.log('Resposta da limpeza de acessos recebida');

  return data;
}
