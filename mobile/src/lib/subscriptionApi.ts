import { api } from './api';

export type ExploradorPlan = {
  id: string;
  nome: string;
  gramas: number;
  preco_cents: number;
  frete: 'gratis' | 'pago';
  descricao: string;
  destaque: boolean;
};

export type PlansResponse = {
  exploradorPlans: ExploradorPlan[];
  meuCafe: {
    freteGratisAcimaDeCents: number;
    quantidadesGramas: number[];
  };
};

export type SubscriptionInput =
  | { tipo: 'explorador'; planId: string }
  | { tipo: 'meu_cafe'; productId: string; gramas: number };

export type Subscription = {
  id: string;
  tipo: 'explorador' | 'meu_cafe';
  plan_id: string | null;
  product_id: string | null;
  gramas: number | null;
  preco_cents: number;
  frete: 'gratis' | 'pago';
  status: 'active' | 'canceled';
  plan_nome?: string;
  product_nome?: string;
};

export const subscriptionApi = {
  getPlans: () => api.get<PlansResponse>('/api/subscriptions/plans', false),

  subscribe: (input: SubscriptionInput) =>
    api.post<{ subscription: Subscription }>('/api/subscriptions', input),

  listMine: () => api.get<{ subscriptions: Subscription[] }>('/api/subscriptions/me'),

  cancel: (id: string) => api.post<{ subscription: Subscription }>(`/api/subscriptions/${id}/cancel`)
};
