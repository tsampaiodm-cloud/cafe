import React, { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../lib/api';

export type CartItem = {
  id: string;
  tipo: 'produto' | 'assinatura';
  nome: string;
  detalhe: string;
  precoCents: number; // preço em centavos — mesmo padrão do backend, evita erro de arredondamento
  quantidade: number;
  unico?: boolean; // assinaturas não têm stepper de quantidade, só remover
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantidade'>) => void;
  removeItem: (id: string) => void;
  changeQuantity: (id: string, delta: number) => void;
  totalCents: number;
  count: number;
  checkout: () => Promise<{ checkoutUrl: string; orderId: string }>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

// TODO(Fase 2 do roteiro): hoje o carrinho vive só em memória no
// cliente, igual ao protótipo em HTML. Quando a API de carrinho
// persistente existir no backend, troque o useState local por
// chamadas a GET/POST/PATCH /api/cart aqui dentro, mantendo a mesma
// interface pro resto do app (os componentes que usam useCart() não
// precisam mudar).
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(item: Omit<CartItem, 'quantidade'>) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing && !item.unico) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      if (existing) return prev; // item único já está no carrinho
      return [...prev, { ...item, quantidade: 1 }];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function changeQuantity(id: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0)
    );
  }

  async function checkout() {
    const payload = {
      items: items.map((i) => ({
        nome: i.nome,
        detalhe: i.detalhe,
        precoCents: i.precoCents,
        quantidade: i.quantidade
      }))
    };
    // Já usa o endpoint real do backend — cria o pedido "pending" e
    // devolve a URL de Checkout do Stripe pra abrir no navegador/WebView.
    return api.post<{ checkoutUrl: string; orderId: string }>('/api/payment/checkout-session', payload);
  }

  const totalCents = items.reduce((sum, i) => sum + i.precoCents * i.quantidade, 0);
  const count = items.reduce((sum, i) => sum + i.quantidade, 0);

  const value = useMemo(
    () => ({ items, addItem, removeItem, changeQuantity, totalCents, count, checkout }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa ser usado dentro de <CartProvider>');
  return ctx;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
