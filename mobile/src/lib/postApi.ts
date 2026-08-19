import { api } from './api';

export type Comment = {
  id: string;
  autor_nome: string;
  texto: string;
  created_at: string;
  parent_comment_id: string | null;
  replies: Comment[];
};

export type Post = {
  id: string;
  user_id?: string;
  autor_nome: string;
  tipo: 'avaliacao' | 'receita';
  produto_id: string | null;
  titulo: string;
  nota: number | null;
  texto: string;
  tem_foto: boolean;
  published_to_feed?: boolean;
  created_at: string;
  like_count: string;
  comment_count: string;
};

export type PostDetail = Post & { comments: Comment[] };

export type NewPostInput =
  | {
      tipo: 'avaliacao';
      produtoId: string;
      nota: number;
      texto: string;
      temFoto?: boolean;
      publicarNoFeed?: boolean;
    }
  | {
      tipo: 'receita';
      titulo: string;
      texto: string;
      temFoto?: boolean;
      publicarNoFeed?: boolean;
    };

export const postApi = {
  getFeed: (tipo?: 'avaliacao' | 'receita') =>
    api.get<{ posts: Post[] }>(`/api/posts/feed${tipo ? `?tipo=${tipo}` : ''}`, false),

  getDiario: () => api.get<{ posts: Post[] }>('/api/posts/diario'),

  getPost: (id: string) => api.get<{ post: PostDetail }>(`/api/posts/${id}`, false),

  create: (input: NewPostInput) => api.post<{ post: Post }>('/api/posts', input),

  publish: (id: string) => api.post<{ post: Post }>(`/api/posts/${id}/publish`),

  toggleLike: (id: string) => api.post<{ liked: boolean }>(`/api/posts/${id}/like`),

  comment: (id: string, texto: string, parentCommentId?: string) =>
    api.post<{ comment: Comment }>(`/api/posts/${id}/comments`, { texto, parentCommentId })
};
