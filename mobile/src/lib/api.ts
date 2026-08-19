import Constants from 'expo-constants';
import { storage } from './storage';

const API_URL: string = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';
const TOKEN_KEY = 'tia_xicara_token';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // anexa o Bearer token quando true (padrão)
};

/**
 * Wrapper único pra toda chamada à API — é aqui que o token vai no
 * header em toda rota autenticada, e onde tratamos respostas de erro
 * do backend de forma consistente (o backend sempre responde
 * { error, message, details? } em caso de falha, inclusive no 429
 * do rate limiting de login).
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await storage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message || 'Não foi possível completar a solicitação.',
      payload?.error,
      payload?.details
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body, auth })
};

export { TOKEN_KEY };
