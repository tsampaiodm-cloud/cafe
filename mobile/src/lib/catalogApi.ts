import { api } from './api';

export type Farm = {
  id: string;
  nome: string;
  regiao: string;
  produtor: string;
  resumo: string;
  hero_foto: string | null;
  avg_rating: string;
  review_count: string;
};

export type FarmDetail = Farm & {
  historia: string[];
  certificacoes: string[];
  fotos: string[];
  produtos: Product[];
};

export type Product = {
  id: string;
  farm_id: string | null;
  nome: string;
  preco_cents: number;
  peso: string;
  variedade: string | null;
  torra: string | null;
  processo: string | null;
  sca_score: string | null;
  notas: string | null;
  foto: string | null;
  barcode: string | null;
  farm_nome?: string;
  farm_regiao?: string;
  avg_rating: string;
  review_count: string;
};

export type Review = {
  id: string;
  nota: number;
  comentario: string;
  created_at: string;
  autor_nome: string;
};

export type ProductDetail = Product & {
  farm_resumo?: string;
  avaliacoes: Review[];
};

export type FarmFilters = {
  busca?: string;
  regiao?: string;
  notaMinima?: number;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  return `?${qs}`;
}

export const catalogApi = {
  listFarms: (filters: FarmFilters = {}) =>
    api.get<{ farms: Farm[]; regioesDisponiveis: string[] }>(
      `/api/catalog/farms${buildQuery(filters)}`,
      false
    ),

  getFarm: (id: string) => api.get<{ farm: FarmDetail }>(`/api/catalog/farms/${id}`, false),

  listProducts: () => api.get<{ products: Product[] }>('/api/catalog/products', false),

  getProduct: (id: string) => api.get<{ product: ProductDetail }>(`/api/catalog/products/${id}`, false),

  getProductByBarcode: (codigo: string) =>
    api.get<{ product: Product }>(`/api/catalog/products/by-barcode/${codigo}`, false),

  postReview: (productId: string, review: { nota: number; comentario: string }) =>
    api.post<{ review: Review }>(`/api/catalog/products/${productId}/reviews`, review)
};
