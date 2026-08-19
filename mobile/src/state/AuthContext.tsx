import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, TOKEN_KEY } from '../lib/api';
import { storage } from '../lib/storage';

type Profile = {
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
} | null;

type User = { id: string; email: string };

type AuthContextValue = {
  user: User | null;
  profile: Profile;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao abrir o app, tenta restaurar a sessão a partir do token salvo.
  useEffect(() => {
    (async () => {
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await api.get<{ id: string; email: string; profile: Profile }>('/api/auth/me');
        setUser({ id: me.id, email: me.email });
        setProfile(me.profile);
      } catch {
        // token expirado/inválido — limpa e deixa cair pro fluxo de login
        await storage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    // Deixa o ApiError propagar pra tela de login tratar (inclusive
    // o 429 do rate limiting, com a mensagem que o backend já formata).
    const result = await api.post<{ token: string; user: User }>(
      '/api/auth/login',
      { email, password },
      false
    );
    await storage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    await refreshProfile();
  }

  async function register(nome: string, email: string, password: string) {
    const result = await api.post<{ token: string; user: User }>(
      '/api/auth/register',
      { nome, email, password },
      false
    );
    await storage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    await refreshProfile();
  }

  async function logout() {
    await storage.removeItem(TOKEN_KEY);
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    try {
      const result = await api.get<{ profile: Profile }>('/api/profile');
      setProfile(result.profile);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
      }
    }
  }

  const value = useMemo(
    () => ({ user, profile, isLoading, login, register, logout, refreshProfile }),
    [user, profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
