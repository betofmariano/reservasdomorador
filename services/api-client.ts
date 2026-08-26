import { Platform } from 'react-native';

import { API_ENDPOINTS, XANO_API_BASE_URL } from '@/constants/api';
import { syncServerTimeFromResponse } from '@/utils/server-time';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.mensagem === 'string' && record.mensagem.trim()) {
    return record.mensagem.trim();
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error;
  }

  if (typeof record.detail === 'string' && record.detail.trim()) {
    return record.detail;
  }

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const firstError = record.errors[0];

    if (typeof firstError === 'string') {
      return firstError;
    }

    if (firstError && typeof firstError === 'object') {
      const errorRecord = firstError as Record<string, unknown>;

      if (typeof errorRecord.message === 'string') {
        return errorRecord.message;
      }
    }
  }

  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  let response: Response;

  try {
    response = await fetch(`${XANO_API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.');
  }

  syncServerTimeFromResponse(response);

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ??
      'Não foi possível concluir a operação. Tente novamente.';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function postRequest<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
  });
}

export async function getRequest<T>(path: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'GET',
  });
}

export async function getRequestFromBaseUrl<T>(baseUrl: string, path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.');
  }

  syncServerTimeFromResponse(response);

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ??
      'Não foi possível concluir a operação. Tente novamente.';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function postRequestFromBaseUrl<T>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.');
  }

  syncServerTimeFromResponse(response);

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ??
      'Não foi possível concluir a operação. Tente novamente.';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function patchRequestFromBaseUrl<T>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.');
  }

  syncServerTimeFromResponse(response);

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ??
      'Não foi possível concluir a operação. Tente novamente.';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function authGetRequest<T>(path: string, token: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function authPostRequest<T>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });
}

export async function authPatchRequest<T>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });
}

export async function authPutRequest<T>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });
}

export async function authDeleteRequest<T>(
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });
}

async function authMultipartRequest<T>(
  path: string,
  token: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH',
  defaultErrorMessage: string,
): Promise<T> {
  const url = `${XANO_API_BASE_URL}${path}`;
  const requestInit: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  };

  let response: Response;

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.fetch === 'function') {
      response = await window.fetch(url, requestInit);
    } else {
      response = await fetch(url, requestInit);
    }
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.');
  }

  syncServerTimeFromResponse(response);

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = extractErrorMessage(payload) ?? defaultErrorMessage;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function authMultipartPutRequest<T>(
  path: string,
  token: string,
  formData: FormData,
): Promise<T> {
  return authMultipartRequest<T>(
    path,
    token,
    formData,
    'PUT',
    'Não foi possível atualizar o local. Tente novamente.',
  );
}

export async function authMultipartPatchRequest<T>(
  path: string,
  token: string,
  formData: FormData,
  defaultErrorMessage = 'Não foi possível atualizar sua foto. Tente novamente.',
): Promise<T> {
  return authMultipartRequest<T>(
    path,
    token,
    formData,
    'PATCH',
    defaultErrorMessage,
  );
}

export async function authMultipartPostRequest<T>(
  path: string,
  token: string,
  formData: FormData,
): Promise<T> {
  return authMultipartRequest<T>(
    path,
    token,
    formData,
    'POST',
    'Não foi possível atualizar sua foto. Tente novamente.',
  );
}
