import type { PhotoAsset } from '@/types/user-photo';

export type SignupPhotoAsset = PhotoAsset;

export type SignupFoneRequest = {
  nome: string;
  telefoneLimpo: string;
  password: string;
  matricula: string;
  complemento: string;
  academias_id: number;
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
