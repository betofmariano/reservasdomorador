import { Platform } from 'react-native';

import { ApiError } from '@/services/api-client';

export type PhotoUploadAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: File;
};

/** Na web, usa o FormData nativo do browser (RN não serializa File corretamente). */
export function createMultipartFormData(): FormData {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.FormData === 'function') {
    return new window.FormData();
  }

  return new FormData();
}

export function resolveUploadFilename(photoAsset: PhotoUploadAsset): string {
  const fromUri = photoAsset.uri.split('/').pop()?.split('?')[0];

  return photoAsset.fileName || fromUri || `foto-${Date.now()}.jpg`;
}

export function resolveUploadMimeType(filename: string, photoAsset: PhotoUploadAsset): string {
  if (photoAsset.mimeType?.trim()) {
    return photoAsset.mimeType;
  }

  return filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}

function toUploadFile(blob: Blob, filename: string, mimeType: string): File {
  if (blob instanceof File && blob.size > 0) {
    return blob;
  }

  if (blob.size <= 0) {
    throw new ApiError('Não foi possível preparar a foto para envio.');
  }

  return new File([blob], filename, { type: mimeType || blob.type || 'image/jpeg' });
}

export async function resolveUploadFileBlob(
  fileAsset: PhotoUploadAsset,
  filename = resolveUploadFilename(fileAsset),
  mimeType = resolveUploadMimeType(filename, fileAsset),
): Promise<File | Blob> {
  if (!fileAsset.uri?.trim()) {
    throw new ApiError('Não foi possível enviar o arquivo. Tente novamente.');
  }

  if (Platform.OS === 'web') {
    return resolveWebUploadFile(fileAsset, filename, mimeType);
  }

  if (fileAsset.file instanceof Blob && fileAsset.file.size > 0) {
    return toUploadFile(fileAsset.file, filename, mimeType);
  }

  return {
    uri: fileAsset.uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob;
}

async function resolveWebUploadFile(
  photoAsset: PhotoUploadAsset,
  filename: string,
  mimeType: string,
): Promise<File> {
  if (photoAsset.file instanceof Blob && photoAsset.file.size > 0) {
    return toUploadFile(photoAsset.file, filename, mimeType);
  }

  const response = await fetch(photoAsset.uri);

  if (!response.ok) {
    throw new ApiError('Não foi possível preparar a foto para envio.');
  }

  const blob = await response.blob();

  return toUploadFile(blob, filename, mimeType);
}

export async function appendFileUploadToFormData(
  formData: FormData,
  fieldName: string,
  fileAsset: PhotoUploadAsset,
  filename = resolveUploadFilename(fileAsset),
  mimeType = resolveUploadMimeType(filename, fileAsset),
): Promise<void> {
  if (!fileAsset.uri?.trim()) {
    throw new ApiError('Não foi possível enviar o arquivo. Tente novamente.');
  }

  if (Platform.OS === 'web') {
    const file = await resolveWebUploadFile(fileAsset, filename, mimeType);
    formData.append(fieldName, file, filename);
    return;
  }

  if (fileAsset.file instanceof Blob && fileAsset.file.size > 0) {
    formData.append(fieldName, fileAsset.file as Blob, filename);
    return;
  }

  formData.append(
    fieldName,
    {
      uri: fileAsset.uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob,
  );
}

export async function appendPhotoUploadToFormData(
  formData: FormData,
  fieldName: string,
  photoAsset: PhotoUploadAsset,
  filename = resolveUploadFilename(photoAsset),
  mimeType = resolveUploadMimeType(filename, photoAsset),
): Promise<void> {
  return appendFileUploadToFormData(formData, fieldName, photoAsset, filename, mimeType);
}

export async function sendMultipartFormData(
  url: string,
  formData: FormData,
  init?: Omit<RequestInit, 'body'>,
): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    body: formData,
  };

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch(url, requestInit);
  }

  return fetch(url, requestInit);
}

export async function postMultipartFormData(
  url: string,
  formData: FormData,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<Response> {
  return sendMultipartFormData(url, formData, {
    ...init,
    method: 'POST',
  });
}
