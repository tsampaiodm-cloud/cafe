-- =========================================================
-- Schema do Tia Xícara — usuários, perfis, pedidos e RLS
-- =========================================================
-- Rode este arquivo como um usuário com privilégio de owner
-- (ex.: postgres), mas a aplicação deve se conectar com um
-- role separado e SEM privilégio de owner sobre estas tabelas
-- (ver seção "ROLE DE APLICAÇÃO" no final) — do contrário,
-- o Postgres ignora as políticas de RLS para o dono da tabela.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- users ----------
-- Guarda só o essencial para autenticação. Nunca é exposta
-- diretamente pela API além de id/email; password_hash nunca
-- sai do backend em nenhuma resposta.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- profiles ----------
-- Dados pessoais (endereço, CPF para nota fiscal/logística, foto).
-- Protegida por RLS: cada usuário só enxerga e edita a própria linha.
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  telefone     TEXT,
  cpf          TEXT,
  cep          TEXT,
  rua          TEXT,
  numero       TEXT,
  complemento  TEXT,
  bairro       TEXT,
  cidade       TEXT,
  uf           TEXT,
  foto_url     TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- orders / order_items ----------
-- Pedidos criados a partir do carrinho, ligados ao checkout do Stripe.
CREATE TABLE IF NOT EXISTS orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'paid', 'canceled', 'failed')),
  total_cents        INTEGER NOT NULL CHECK (total_cents >= 0),
  stripe_session_id  TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  detalhe       TEXT,
  preco_cents   INTEGER NOT NULL CHECK (preco_cents >= 0),
  quantidade    INTEGER NOT NULL CHECK (quantidade > 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
-- Como não usamos um provedor de auth com auth.uid() embutido
-- (tipo Supabase), a identidade do usuário autenticado é
-- propagada por requisição via `set_config('app.user_id', <uuid>, true)`,
-- feito dentro de uma transação pelo helper `withUserContext`
-- (src/config/db.js). As policies abaixo leem esse valor de sessão.

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- FORCE garante que a RLS vale até para o dono da tabela — mantenha
-- ainda assim a aplicação rodando com um role que NÃO é o dono.
ALTER TABLE profiles    FORCE ROW LEVEL SECURITY;
ALTER TABLE orders      FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

-- ---------- profiles ----------
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (id = current_setting('app.user_id', true)::uuid);

-- Sem policy de DELETE proposital: exclusão de perfil passa por um
-- fluxo próprio (ex.: exclusão de conta), não pela API de perfil.

-- ---------- orders ----------
DROP POLICY IF EXISTS orders_select_own ON orders;
CREATE POLICY orders_select_own ON orders
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS orders_insert_own ON orders;
CREATE POLICY orders_insert_own ON orders
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

-- updates (status do pagamento) só acontecem via webhook do Stripe,
-- que roda com uma conexão de serviço à parte (ver paymentService) —
-- não existe policy de UPDATE aqui de propósito, então nenhum usuário
-- autenticado via app.user_id consegue alterar o status do próprio pedido.

-- ---------- order_items ----------
DROP POLICY IF EXISTS order_items_select_own ON order_items;
CREATE POLICY order_items_select_own ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS order_items_insert_own ON order_items;
CREATE POLICY order_items_insert_own ON order_items
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

-- =========================================================
-- CATÁLOGO — fazendas, produtos e avaliações
-- =========================================================
-- farms/products não guardam dado pessoal, então não precisam de RLS
-- (é conteúdo público, igual a qualquer catálogo de loja). Já
-- product_reviews referencia o autor da avaliação, então tem RLS:
-- leitura é pública, mas só o próprio autor edita/apaga a sua.

CREATE TABLE IF NOT EXISTS farms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           TEXT NOT NULL,
  regiao         TEXT NOT NULL,
  produtor       TEXT NOT NULL,
  resumo         TEXT NOT NULL,
  historia       TEXT[] NOT NULL DEFAULT '{}',      -- parágrafos da história da fazenda
  certificacoes  TEXT[] NOT NULL DEFAULT '{}',
  hero_foto      TEXT,
  fotos          TEXT[] NOT NULL DEFAULT '{}',        -- galeria de fotos
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id      UUID REFERENCES farms(id) ON DELETE SET NULL,
  nome         TEXT NOT NULL,
  preco_cents  INTEGER NOT NULL CHECK (preco_cents >= 0),
  peso         TEXT NOT NULL,          -- ex.: "250g"
  variedade    TEXT,
  torra        TEXT,                   -- Clara / Média / Escura
  processo     TEXT,                   -- Natural / Lavado / Cereja descascado...
  sca_score    TEXT,                    -- ex.: "86 pontos"
  notas        TEXT,                   -- notas de prova
  foto         TEXT,
  barcode      TEXT UNIQUE,             -- código de barras (EAN-13) para o scanner
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_farm_id ON products(farm_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

CREATE TABLE IF NOT EXISTS product_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  autor_nome   TEXT NOT NULL, -- nome no momento da avaliação (ver nota abaixo)
  nota         SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id) -- uma avaliação por cliente, por produto
);
-- `autor_nome` é uma cópia do nome do perfil no momento em que a
-- avaliação foi criada, não uma referência ao vivo. Isso é
-- intencional: `profiles` tem RLS restrita à própria linha (ver
-- acima), e a listagem de avaliações é pública — se fôssemos buscar
-- o nome com um JOIN em `profiles` a cada leitura, a política de RLS
-- barraria as linhas de outros usuários e as avaliações apareceriam
-- sem autor (ou nem apareceriam). Guardar o nome aqui evita depender
-- de RLS numa consulta pública.

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON product_reviews(product_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_reviews_select_all ON product_reviews;
CREATE POLICY product_reviews_select_all ON product_reviews
  FOR SELECT
  USING (true); -- avaliação é conteúdo público, qualquer um pode ler

DROP POLICY IF EXISTS product_reviews_insert_own ON product_reviews;
CREATE POLICY product_reviews_insert_own ON product_reviews
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS product_reviews_update_own ON product_reviews;
CREATE POLICY product_reviews_update_own ON product_reviews
  FOR UPDATE
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS product_reviews_delete_own ON product_reviews;
CREATE POLICY product_reviews_delete_own ON product_reviews
  FOR DELETE
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- =========================================================
-- ASSINATURAS
-- =========================================================
-- subscription_plans e app_settings são conteúdo/configuração
-- pública (sem dado pessoal), então sem RLS — igual a farms/products.
-- Isso é o que torna os planos "editáveis depois pelo backend": os
-- preços, gramaturas e regra de frete do Clube Explorador, e o valor
-- mínimo de frete grátis do Clube Meu Café, vêm do banco, não de
-- constante fixa no código.

CREATE TABLE IF NOT EXISTS subscription_plans (
  id           TEXT PRIMARY KEY, -- 'xicara' | 'mais-xicara' | 'mais-xicara-premium'
  nome         TEXT NOT NULL,
  gramas       INTEGER NOT NULL,
  preco_cents  INTEGER NOT NULL CHECK (preco_cents >= 0),
  frete        TEXT NOT NULL CHECK (frete IN ('gratis', 'pago')),
  descricao    TEXT NOT NULL,
  destaque     BOOLEAN NOT NULL DEFAULT false, -- ex.: selo "Mais popular"
  ordem        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app_settings (
  key    TEXT PRIMARY KEY,
  value  JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL CHECK (tipo IN ('explorador', 'meu_cafe')),
  plan_id      TEXT REFERENCES subscription_plans(id),   -- só para tipo = 'explorador'
  product_id   UUID REFERENCES products(id),               -- só para tipo = 'meu_cafe'
  gramas       INTEGER,                                     -- só para tipo = 'meu_cafe'
  preco_cents  INTEGER NOT NULL CHECK (preco_cents >= 0),    -- sempre calculado no servidor
  frete        TEXT NOT NULL CHECK (frete IN ('gratis', 'pago')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at  TIMESTAMPTZ,
  CHECK (
    (tipo = 'explorador' AND plan_id IS NOT NULL AND product_id IS NULL AND gramas IS NULL) OR
    (tipo = 'meu_cafe' AND product_id IS NOT NULL AND gramas IS NOT NULL AND plan_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS subscriptions_insert_own ON subscriptions;
CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS subscriptions_update_own ON subscriptions;
CREATE POLICY subscriptions_update_own ON subscriptions
  FOR UPDATE
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);
-- Sem policy de DELETE: cancelamento é um UPDATE de status, não um
-- DELETE — mantém o histórico de assinaturas do cliente.

-- =========================================================
-- POSTS — Diário pessoal + Feed da comunidade
-- =========================================================
-- Diário e Feed são o MESMO recurso (`posts`), não duas tabelas
-- separadas: todo post nasce privado (visível só pra quem criou —
-- é o "meu diário") e passa a aparecer no Feed público quando o
-- cliente aciona "postar no feed" (published_to_feed = true). Isso
-- espelha exatamente a regra de produto: "posts do diário só vão pro
-- feed se o cliente clicar em postar no feed".

CREATE TABLE IF NOT EXISTS posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  autor_nome            TEXT NOT NULL, -- cópia do nome no momento do post (mesmo motivo de product_reviews.autor_nome)
  tipo                  TEXT NOT NULL CHECK (tipo IN ('avaliacao', 'receita')),
  produto_id            UUID REFERENCES products(id) ON DELETE SET NULL, -- só para tipo = 'avaliacao'
  titulo                TEXT NOT NULL, -- nome do café (avaliação) ou título da receita
  nota                  SMALLINT CHECK (nota IS NULL OR nota BETWEEN 1 AND 5),
  texto                 TEXT NOT NULL,
  tem_foto              BOOLEAN NOT NULL DEFAULT false,
  published_to_feed     BOOLEAN NOT NULL DEFAULT false,
  published_to_feed_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (tipo <> 'avaliacao' OR nota IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts(published_to_feed, created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts FORCE ROW LEVEL SECURITY;

-- A regra de visibilidade central de tudo isso: dono sempre vê o
-- próprio post (privado ou não); qualquer outra pessoa só vê o que
-- já foi publicado no feed.
DROP POLICY IF EXISTS posts_select_own_or_published ON posts;
CREATE POLICY posts_select_own_or_published ON posts
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)::uuid
    OR published_to_feed = true
  );

DROP POLICY IF EXISTS posts_insert_own ON posts;
CREATE POLICY posts_insert_own ON posts
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS posts_update_own ON posts;
CREATE POLICY posts_update_own ON posts
  FOR UPDATE
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);
-- UPDATE own é o que permite "postar no feed" depois (vira um UPDATE
-- de published_to_feed) — sem policy de DELETE por enquanto.

CREATE TABLE IF NOT EXISTS post_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes FORCE ROW LEVEL SECURITY;

-- Curtida só pode existir (ler, criar ou apagar) em post que já é
-- visível pra quem está tentando — dono do post OU post publicado.
-- Sem esse EXISTS, seria possível curtir/enumerar curtidas de um
-- post que ainda é só um rascunho privado de outra pessoa.
DROP POLICY IF EXISTS post_likes_select_visible ON post_likes;
CREATE POLICY post_likes_select_visible ON post_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND (p.published_to_feed = true OR p.user_id = current_setting('app.user_id', true)::uuid)
    )
  );

DROP POLICY IF EXISTS post_likes_insert_own ON post_likes;
CREATE POLICY post_likes_insert_own ON post_likes
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id', true)::uuid
    AND EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.published_to_feed = true)
  );

DROP POLICY IF EXISTS post_likes_delete_own ON post_likes;
CREATE POLICY post_likes_delete_own ON post_likes
  FOR DELETE
  USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE TABLE IF NOT EXISTS post_comments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id             UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  autor_nome          TEXT NOT NULL,
  parent_comment_id   UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  texto               TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON post_comments(post_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments FORCE ROW LEVEL SECURITY;

-- Mesma lógica de post_likes: comentário só existe em post visível
-- pra quem está lendo/escrevendo.
DROP POLICY IF EXISTS post_comments_select_visible ON post_comments;
CREATE POLICY post_comments_select_visible ON post_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND (p.published_to_feed = true OR p.user_id = current_setting('app.user_id', true)::uuid)
    )
  );

DROP POLICY IF EXISTS post_comments_insert_own ON post_comments;
CREATE POLICY post_comments_insert_own ON post_comments
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id', true)::uuid
    AND EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.published_to_feed = true)
  );

-- =========================================================
-- ROLE DE APLICAÇÃO (rode manualmente, ajustando a senha)
-- =========================================================
-- CREATE ROLE tia_xicara_app LOGIN PASSWORD 'senha-forte';
-- GRANT CONNECT ON DATABASE tia_xicara TO tia_xicara_app;
-- GRANT USAGE ON SCHEMA public TO tia_xicara_app;
-- GRANT SELECT, INSERT, UPDATE ON users, profiles, orders, order_items, product_reviews, subscriptions, posts TO tia_xicara_app;
-- GRANT SELECT, INSERT, DELETE ON post_likes TO tia_xicara_app;
-- GRANT SELECT, INSERT ON post_comments TO tia_xicara_app;
-- GRANT SELECT ON farms, products, subscription_plans, app_settings TO tia_xicara_app; -- só leitura pela API pública
-- GRANT DELETE ON product_reviews TO tia_xicara_app; -- cliente pode apagar a própria avaliação
-- -- IMPORTANTE: tia_xicara_app não pode ser dono das tabelas acima,
-- -- ou o Postgres ignora RLS para ele mesmo com FORCE.
