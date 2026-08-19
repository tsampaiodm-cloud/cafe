# Tia Xícara — App (Expo / React Native + Web)

Um único código-base em React Native, rodando em **iOS, Android e
navegador** via [Expo](https://expo.dev) + `react-native-web` —
implementa a Fase 1 do roteiro de lançamento.

## Por que Expo

Expo é a forma mais direta de sair de um código-base React Native pra
iOS + Android + Web com o mínimo de configuração nativa manual (build
de Xcode/Android Studio fica a cargo do `eas build` quando chegar a
hora). Se depois for necessário algum módulo nativo que o Expo
managed workflow não cobre, dá pra fazer o "prebuild" (`expo prebuild`)
e sair do modo gerenciado sem reescrever o app.

## Como rodar

```bash
npm install
npm run web      # abre no navegador
npm run ios      # abre no simulador iOS (precisa de macOS + Xcode)
npm run android  # abre no emulador Android
```

> Este ambiente de geração de código não tem acesso à internet, então
> não foi possível rodar `npm install` nem os comandos acima aqui.
> Todo arquivo `.tsx`/`.ts` foi checado com o compilador TypeScript
> usando um stub de tipos "coringa" (só pra pegar erro de sintaxe sem
> precisar baixar os pacotes reais) e revisado manualmente — mas rode
> o app de verdade no seu ambiente antes de considerar qualquer tela
> pronta.

### Conectando ao backend

O app aponta para a API pela variável `extra.apiUrl` em `app.json`
(hoje `http://localhost:3000`, o backend que já construímos). Pra
testar no celular físico durante o desenvolvimento, troque
`localhost` pelo IP da sua máquina na rede local — `localhost` dentro
do simulador/emulador nem sempre aponta pro seu computador.

Para produção, o ideal é ter um `app.config.js` que lê a URL da API de
uma variável de ambiente por build (dev/staging/produção), em vez do
valor fixo em `app.json`.

## O que já está implementado

- **Autenticação completa**: login e cadastro conectados de verdade ao
  backend (`/api/auth/login`, `/api/auth/register`), incluindo o
  tratamento da mensagem de rate limiting (HTTP 429) quando o login
  erra demais.
- **Sessão persistida**: o token JWT fica no Keychain/Keystore nativo
  (via `expo-secure-store`) e em `localStorage` na versão web —
  reabrir o app não pede login de novo enquanto o token for válido.
- **Perfil**: leitura e edição ligadas a `GET`/`PATCH /api/profile`
  de verdade, incluindo "Sair da conta".
- **Carrinho**: mesma lógica do protótipo (adicionar, remover, alterar
  quantidade), mas agora com **checkout real**: `Finalizar compra`
  chama `POST /api/payment/checkout-session` e abre a URL de Checkout
  do Stripe retornada pelo backend.
- **Loja**: lista os produtos reais de `GET /api/catalog/products`,
  com nota média e link pra tela de detalhe.
- **Direto do Produtor**: consome `GET /api/catalog/farms` de
  verdade, com busca (debounce de 350ms), filtro por região e por
  avaliação mínima. A lista já vem em ordem aleatória a cada
  chamada — recarregada automaticamente toda vez que a aba ganha foco,
  reproduzindo o "embaralha a cada visita" do protótipo, mas decidido
  no servidor.
- **Detalhe de fazenda**: galeria, história, certificações e os cafés
  que ela produz (`GET /api/catalog/farms/:id`), cada um linkando pra
  tela de detalhe do produto.
- **Detalhe de produto**: especificações, notas de prova, média de
  avaliações e a lista de avaliações de clientes (`GET
  /api/catalog/products/:id`), com formulário pra enviar uma nova
  avaliação (`POST .../reviews` — uma por cliente por produto; o
  backend recusa a segunda com 409, tratado na tela).
- **Scanner de código de barras real** (câmera nativa, via
  `expo-camera`) no iOS/Android, já ligado a `GET
  /api/catalog/products/by-barcode/:codigo` — lê o código e abre a
  tela do produto correspondente. Na versão web, mostra um campo de
  busca manual do código em vez da câmera (suporte de navegador é
  inconsistente entre browsers).
- **Navegação responsiva**: menu fixo embaixo no mobile; a partir de
  860px de largura (`DESKTOP_BREAKPOINT` em `src/theme/spacing.ts`),
  o mesmo menu vira uma barra fina no topo — pensado pra quando a
  versão web for aberta numa tela de desktop, não só num navegador de
  celular.
- **Tema visual**: cores, tipografia (Playfair Display, Lato, Great
  Vibes) e componentes base (`Button`, `Card`, `TopBar`, `StarRating`)
  já batendo com o protótipo em HTML.

### Observação sobre o gate de login

Hoje o app inteiro fica atrás de tela de login (`RootNavigator` só
mostra `MainTabs` com `user` autenticado). Mas os endpoints de
catálogo (`/api/catalog/*`, exceto `POST .../reviews`) foram feitos
de propósito **públicos** no backend, pra permitir navegar pela loja
sem conta. Se quiser aproveitar isso (deixar Home/Loja/Produtor
acessíveis sem login, pedindo conta só no checkout/avaliação), é uma
mudança pontual no `RootNavigator` — vale decidir isso como produto
antes de implementar.

- **Trilhas**: as 7 categorias educativas (`src/data/trilhas.ts`),
  cada uma abrindo a lista de conteúdos daquele tema. É conteúdo
  estático — não depende de nenhuma API.
- **Assinatura**: Clube Explorador (3 planos, vindos de
  `GET /api/subscriptions/plans`, já com o preço calculado no
  servidor) e Clube Meu Café (escolhe o café e a quantidade, com
  estimativa de preço e aviso de frete grátis calculados a partir da
  mesma config do backend). Assinar chama `POST /api/subscriptions`
  e, com o preço autoritativo devolvido pelo servidor, adiciona ao
  carrinho — o pagamento em si segue o mesmo fluxo de checkout já
  existente.
- **Feed**: avaliações e receitas públicas da comunidade
  (`GET /api/posts/feed`, com filtro por tipo), cada post abrindo uma
  tela de detalhe com curtir (otimista, com rollback se a chamada
  falhar) e comentários — incluindo respostas aninhadas a comentários
  específicos. O botão flutuante abre o compositor de post
  (`NewPostScreen`) já publicando direto no feed.
- **Diário**: o mesmo compositor de post, mas os registros começam
  privados (só o próprio cliente vê) — cada entrada tem um botão
  "Postar no feed" que só aparece se ainda não foi publicada. Feed e
  Diário são o mesmo recurso no backend (uma tabela `posts`); a
  diferença é só o filtro de visibilidade.

## O que ainda falta portar

Tudo das 6 abas do menu inferior já está portado e ligado à API real.
O que ainda vale considerar como próximo passo:

1. Upload de foto de verdade nos posts do Feed/Diário (hoje só existe
   um toggle "tem foto" — o botão liga uma flag booleana, não sobe um
   arquivo, já que isso depende de um storage de imagens configurado
   — Fase 6 do roteiro)
2. Tela de "Minhas assinaturas" no Perfil (o backend já tem
   `GET /api/subscriptions/me` e `POST /api/subscriptions/:id/cancel`
   prontos, só falta a interface)
3. Indicador de "você já curtiu esse post" ao carregar o Feed — hoje
   o estado de curtida começa sempre como "não curtido" e só atualiza
   depois de uma ação na sessão atual (ver comentário em
   `postService.js` no backend sobre essa simplificação)

## Estrutura de pastas

```
App.tsx                    # carrega fontes, provê contexto, monta navegação
src/
  theme/                   # cores, tipografia, espaçamento
  lib/
    api.ts                 # cliente HTTP (anexa o JWT automaticamente)
    storage.ts              # SecureStore (nativo) / localStorage (web)
  state/
    AuthContext.tsx         # sessão, login, cadastro, logout
    CartContext.tsx         # carrinho + checkout
  navigation/
    RootNavigator.tsx        # troca Auth ↔ App principal
    AuthNavigator.tsx
    MainTabs.tsx
    ResponsiveTabBar.tsx      # menu embaixo (mobile) / topo (desktop web)
  components/               # Button, Card, TopBar, PlaceholderScreen
  screens/                   # uma pasta por tela
    HomeScreen.tsx
    LojaScreen.tsx
    ProdutorScreen.tsx
    FarmDetailScreen.tsx
    ProductDetailScreen.tsx
    AssinaturaScreen.tsx      # placeholder
    FeedScreen.tsx            # placeholder
    DiarioScreen.tsx          # placeholder
    TrilhasScreen.tsx         # placeholder
    ScannerScreen.tsx
    CartScreen.tsx
    ProfileScreen.tsx
    auth/
```

## Próximos passos técnicos

- Configurar `eas.json` e rodar `eas build` quando for gerar os
  binários reais pra loja (Fase 4 do roteiro).
- Adicionar testes (Jest + React Native Testing Library).
- Configurar `expo-notifications` quando o backend tiver endpoint de
  push (ainda não existe).
- Revisar acessibilidade (`accessibilityLabel` já começou a ser usado
  na `TopBar`, mas precisa de uma passada completa).
