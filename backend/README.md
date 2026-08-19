# Tia Xícara — Backend (auth, perfil e pagamento)

Backend em Node.js/Express que implementa:

- Registro/login com senha em hash **bcrypt (fator de custo 12)** — nunca texto plano.
- **Row Level Security (RLS)** no PostgreSQL, impedindo que um usuário leia ou edite dados de outro.
- **Validação e sanitização estrita** de todos os inputs (Zod + checagem de dígito verificador de CPF).
- **Rate limiting** de login por IP via Redis: 5 tentativas incorretas por 15 minutos, com HTTP 429.
- **Pagamento** via Stripe Checkout, com webhook validado por assinatura.

## Stack

Node.js + Express · PostgreSQL (`pg`) · Redis (`ioredis`) · `bcrypt` · `jsonwebtoken` · `zod` · `stripe`.

## Como rodar

```bash
cp .env.example .env
# edite o .env com suas credenciais reais de Postgres, Redis, JWT e Stripe

npm install
npm run migrate   # aplica src/db/schema.sql (tabelas + policies de RLS)
npm run seed       # (opcional) popula fazendas/produtos/avaliações de exemplo
npm run dev
```

> Este ambiente de geração de código não tem acesso à internet, então
> `npm install` e um teste de ponta a ponta não puderam ser executados
> aqui. Todo arquivo `.js` foi validado com `node --check` (sintaxe
> correta) e a lógica foi revisada manualmente — mas rode os testes
> de integração no seu ambiente antes de ir para produção.

### Role de banco dedicado (importante)

O dono das tabelas **ignora RLS por padrão**, mesmo com `FORCE ROW LEVEL
SECURITY`. Crie um role de aplicação separado (comando comentado no
final de `src/db/schema.sql`) e aponte `DATABASE_URL` para ele — nunca
para o usuário `postgres` ou o dono do schema.

## Como a autenticação funciona

1. **Registro** (`POST /api/auth/register`): valida `nome`/`email`/`password`
   (senha: 8-72 caracteres, com maiúscula, minúscula e número), gera o
   hash com `bcrypt.hash(senha, 12)` e cria `users` + `profiles` na
   mesma transação.
2. **Login** (`POST /api/auth/login`):
   - Primeiro passa pelo rate limiter (ver abaixo).
   - Busca o usuário por e-mail e compara a senha com `bcrypt.compare`.
   - Se o e-mail não existir, comparamos mesmo assim contra um hash
     "de mentira" gerado no boot do processo — isso equaliza o tempo
     de resposta e evita vazar, por timing, quais e-mails existem.
   - Em caso de falha, registra uma tentativa no Redis. Em caso de
     sucesso, zera o contador daquele IP.
3. O token retornado é um **JWT** (`sub` = id do usuário), verificado
   pelo middleware `requireAuth` em toda rota protegida.

## Rate limiting de login

Implementado em `src/middleware/loginRateLimiter.js` com Redis:

- Chave `login_attempts:<ip>` no Redis.
- `checkLoginRateLimit` roda **antes** do controller: se o IP já tem
  5 tentativas incorretas registradas, responde `429` com header
  `Retry-After` (segundos restantes) — nem chega a consultar o banco
  ou rodar bcrypt.
- Só uma tentativa **incorreta** de senha incrementa o contador
  (`registerFailedLoginAttempt`), com `EXPIRE` de 900s (15min) setado
  no primeiro incremento da janela.
- Login bem-sucedido limpa o contador do IP (`clearLoginAttempts`).
- Se o Redis cair, a rota falha fechada (retorna 503) em vez de
  desligar o rate limiting silenciosamente.

Os valores (5 tentativas / 15 minutos) são configuráveis via
`LOGIN_RATE_LIMIT_MAX_ATTEMPTS` e `LOGIN_RATE_LIMIT_WINDOW_SECONDS`
no `.env`.

## Row Level Security

Como o projeto não usa um provedor de auth com `auth.uid()` embutido
(tipo Supabase), a identidade do usuário autenticado é propagada por
requisição via `set_config('app.user_id', <uuid>, true)`, dentro de
uma transação — feito pelo helper `withUserContext` em
`src/config/db.js`. As policies em `profiles`, `orders` e `order_items`
comparam suas condições com `current_setting('app.user_id', true)`.

Na prática: **toda** leitura/escrita de dado pessoal passa por
`withUserContext(req.user.id, ...)`, então mesmo que a camada de
aplicação esqueça um `WHERE user_id = ...` em algum lugar, o banco
recusa a consulta cruzada — a defesa não depende só do código da API.

Se seu projeto já usa Supabase (Postgres + Auth gerenciados), a
mesma ideia se aplica trocando `current_setting('app.user_id', true)`
por `auth.uid()` nas policies, sem precisar do `withUserContext`
manual — o Supabase já injeta isso automaticamente por conexão.

## Validação e sanitização de inputs

Todo body de requisição passa pelo middleware `validateBody(schema)`
(`src/middleware/validate.js`), que:

1. Sanitiza strings (remove caracteres de controle, aplica `trim`).
2. Valida estritamente contra um schema Zod (`src/utils/validators.js`)
   — e-mail, complexidade de senha, CPF com dígito verificador
   validado (não só formato), CEP/telefone só com dígitos, UF numa
   lista fechada, etc. `profileUpdateSchema` usa `.strict()`, então
   qualquer campo fora da lista permitida já é rejeitado com `400`.
3. Substitui `req.body` pelos dados já normalizados — os controllers
   nunca leem o body cru da requisição.

Contra SQL injection: **toda** query usa placeholders parametrizados
(`$1, $2, ...`); nunca há concatenação de string com valor vindo do
cliente. A única exceção é o nome de coluna em `updateProfile`
(`src/services/userService.js`), e mesmo ali o nome vem de uma
whitelist fixa de 9 colunas conhecidas — nunca de string livre do
usuário.

## Pagamento (Stripe)

- `POST /api/payment/checkout-session` (autenticado): recebe os itens
  do carrinho (já validados por `checkoutSchema`), cria um pedido
  `pending` no banco e devolve a URL de Checkout do Stripe.
- `POST /api/payment/webhook`: recebido do Stripe, valida a assinatura
  HMAC (`stripe.webhooks.constructEvent`) antes de confiar em qualquer
  dado do payload — sem isso, qualquer um poderia forjar um "pagamento
  aprovado". Em `checkout.session.completed`, marca o pedido como
  `paid`; em `checkout.session.expired`, como `failed`.
- Preços trafegam sempre em **centavos** (inteiros), evitando erro de
  arredondamento de ponto flutuante com dinheiro.

Para testar localmente, use a Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

## Endpoints

| Método | Rota                                        | Autenticado | Descrição                          |
|--------|-----------------------------------------------|:-----------:|-------------------------------------|
| POST   | `/api/auth/register`                          | não          | Cria conta (nome, e-mail, senha)    |
| POST   | `/api/auth/login`                             | não          | Login (rate limited por IP)         |
| GET    | `/api/auth/me`                                | sim          | Usuário + perfil da sessão atual    |
| GET    | `/api/profile`                                | sim          | Lê o próprio perfil                 |
| PATCH  | `/api/profile`                                | sim          | Atualiza o próprio perfil           |
| POST   | `/api/payment/checkout-session`               | sim          | Cria sessão de pagamento Stripe     |
| POST   | `/api/payment/webhook`                        | (Stripe)     | Callback de status do pagamento     |
| GET    | `/api/catalog/farms`                          | não          | Lista fazendas (ordem aleatória, com filtros) |
| GET    | `/api/catalog/farms/:id`                      | não          | Detalhe da fazenda + seus produtos  |
| GET    | `/api/catalog/products`                       | não          | Lista todos os produtos (Loja)      |
| GET    | `/api/catalog/products/:id`                   | não          | Detalhe do produto + avaliações     |
| GET    | `/api/catalog/products/by-barcode/:codigo`    | não          | Busca produto pelo código de barras (scanner) |
| POST   | `/api/catalog/products/:id/reviews`           | sim          | Cria uma avaliação (1 por cliente por produto) |
| GET    | `/api/subscriptions/plans`                    | não          | Planos do Clube Explorador + config do Clube Meu Café |
| POST   | `/api/subscriptions`                          | sim          | Assina um plano (preço sempre calculado no servidor) |
| GET    | `/api/subscriptions/me`                       | sim          | Lista as assinaturas do próprio cliente |
| POST   | `/api/subscriptions/:id/cancel`               | sim          | Cancela uma assinatura própria           |

### Catálogo (fazendas, produtos e avaliações)

- `GET /api/catalog/farms` aceita `?regiao=`, `?busca=` e
  `?notaMinima=` como query params, e devolve a lista **em ordem
  aleatória a cada chamada** (`ORDER BY random()` no Postgres) — é
  assim que reproduzimos, no servidor, o "embaralha a cada visita" que
  o protótipo fazia no cliente. A resposta também inclui
  `regioesDisponiveis`, pra popular o filtro de região sem precisar de
  outra chamada.
- `busca` cobre nome/produtor/região da fazenda e nome/notas/variedade
  de qualquer produto dela — o mesmo campo único que o protótipo já
  usava para "por produtor/fazenda, por café, por região, por notas e
  sabores".
- `product_reviews` guarda uma cópia do nome do cliente
  (`autor_nome`) no momento da avaliação, em vez de buscar o nome
  atual via `JOIN` em `profiles`. Isso é proposital: `profiles` tem
  RLS restrita à própria linha, e a listagem de avaliações é pública —
  um `JOIN` ali faria a política de RLS silenciosamente esconder as
  avaliações de qualquer um que não seja o próprio usuário da sessão.
- Uma avaliação por cliente por produto (`UNIQUE(product_id,
  user_id)` no banco) — tentar avaliar de novo devolve `409`.
- `npm run seed` popula fazendas/produtos/avaliações de exemplo (os
  mesmos dados que já estavam no protótipo em HTML), incluindo 3
  usuários de teste — apague-os antes de produção.

### Assinaturas

- Os 3 planos do **Clube Explorador** (nome, gramatura, preço, regra
  de frete) vêm da tabela `subscription_plans` — exatamente o "esses
  dados devem estar disponíveis para edição depois" que motivou essa
  tabela existir, em vez de ficarem fixos no código.
- O **Clube Meu Café** (assinatura sob medida: qualquer produto do
  catálogo, na gramatura escolhida) usa `app_settings` para o valor
  mínimo de frete grátis e a lista de gramaturas permitidas — mesma
  ideia, configurável sem deploy.
- `POST /api/subscriptions` recebe só a **intenção** (`planId`, ou
  `productId` + `gramas`) — o preço final é sempre recalculado no
  servidor a partir do preço-base do produto, nunca aceito do cliente.
- O pagamento em si continua passando pelo mesmo
  `POST /api/payment/checkout-session` já existente — assinar só
  registra a escolha; cobrar é responsabilidade do fluxo de carrinho/
  checkout que já estava pronto.

## Próximos passos sugeridos

- Refresh tokens / revogação de sessão (hoje o JWT só expira por tempo).
- Verificação de e-mail no registro.
- Testes automatizados (o ambiente aqui não tinha acesso à rede para
  rodar `npm install`/testes de integração).
- Logs estruturados e monitoramento das respostas 429 (possível sinal
  de ataque de força bruta em andamento).
