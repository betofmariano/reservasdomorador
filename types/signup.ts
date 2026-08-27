import type { PhotoAsset } from '@/types/user-photo';
import { normalizeRecordId } from '@/utils/normalize-api-fields';

export type SignupPhotoAsset = PhotoAsset;

export const SIGNUP_CONDOMINIO_REQUIRED_MESSAGE = 'Selecione o condomínio.';

export function resolveSignupCondominioId(value: unknown): number | null {
  const id = normalizeRecordId(value);

  if (id == null || !Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export type SignupFoneRequest = {
  nome: string;
  telefoneLimpo: string;
  password: string;
  matricula: string;
  endereco: string;
  condominio_id: number;
  /** URL pública da foto; no cadastro fica vazio e a API preenche a partir de fotoUpload. */
  Foto: string;
  ultimaPublicidadeData: number | null;
  photoAsset: PhotoAsset;
};

/** @deprecated Use SignupFoneRequest */
export type SignupWithPhotoRequest = SignupFoneRequest;

export type SignupFoneResponse = {
  authToken?: string;
  auth_token?: string;
  token?: string;
  foto?: string;
};

/** @deprecated Use SignupFoneResponse */
export type SignupPhotoResponse = SignupFoneResponse;
