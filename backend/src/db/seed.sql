-- =========================================================
-- Seed de catálogo — dados de exemplo (mesmo conteúdo do protótipo)
-- =========================================================
-- Rode com `npm run seed`. Idempotente: pode rodar várias vezes sem
-- duplicar (usa IDs fixos + ON CONFLICT DO NOTHING).
--
-- As URLs de foto abaixo são placeholders — troque pelas fotos reais
-- quando o storage de imagens estiver configurado (Fase 6 do roteiro).

INSERT INTO farms (id, nome, regiao, produtor, resumo, historia, certificacoes, hero_foto, fotos) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Fazenda Mantiqueira',
  'Serra da Mantiqueira · MG',
  'Família Ferreira',
  'Café cultivado em altitude acima de 1.100m, colhido à mão e com torra artesanal em pequenos lotes.',
  ARRAY[
    'A Fazenda Mantiqueira fica na região de Campos das Vertentes, em Minas Gerais, e está com a família Ferreira há três gerações. Hoje quem cuida da produção é o Seu Antônio, ao lado da esposa Dona Célia e do filho mais novo, Rafael.',
    'A virada para os cafés especiais começou em 2016, quando a família passou a colher apenas os frutos maduros, selecionados um a um, e a documentar cada etapa do processo — da colheita até a secagem no terreiro suspenso.',
    'Hoje a fazenda produz lotes rastreáveis, com variedade, processo e data de colheita registrados, o que ajuda a manter a qualidade constante de safra em safra.'
  ],
  ARRAY['Certifica Minas', 'Rastreabilidade total do lote'],
  'https://cdn.tiaxicara.com.br/fazendas/mantiqueira/hero.jpg',
  ARRAY[
    'https://cdn.tiaxicara.com.br/fazendas/mantiqueira/foto1.jpg',
    'https://cdn.tiaxicara.com.br/fazendas/mantiqueira/foto2.jpg',
    'https://cdn.tiaxicara.com.br/fazendas/mantiqueira/foto3.jpg'
  ]
),
(
  '22222222-2222-2222-2222-222222222222',
  'Fazenda Cerrado Dourado',
  'Cerrado Mineiro · MG',
  'Seu Joaquim Batista',
  'Grãos de torra clara, cultivo sustentável e colheita mecanizada seletiva.',
  ARRAY[
    'No planalto do Cerrado Mineiro, a Fazenda Cerrado Dourado aposta em irrigação por gotejamento e colheita mecanizada seletiva, que respeita o ponto de maturação de cada talhão.',
    'Seu Joaquim Batista, à frente da propriedade, começou a plantar café ainda jovem, seguindo os passos do pai. Hoje a fazenda é referência na região por aliar produtividade com práticas sustentáveis de manejo do solo.',
    'O clima seco e a altitude moderada do Cerrado favorecem grãos mais doces, com acidez equilibrada — o que torna os cafés daqui ótimos para quem está começando a explorar cafés especiais.'
  ],
  ARRAY['UTZ', 'Manejo sustentável do solo'],
  'https://cdn.tiaxicara.com.br/fazendas/cerrado-dourado/hero.jpg',
  ARRAY[
    'https://cdn.tiaxicara.com.br/fazendas/cerrado-dourado/foto1.jpg',
    'https://cdn.tiaxicara.com.br/fazendas/cerrado-dourado/foto2.jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, farm_id, nome, preco_cents, peso, variedade, torra, processo, sca_score, notas, foto, barcode) VALUES
(
  'aaaaaaaa-0001-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Café Reserva Mantiqueira',
  4890, '250g', 'Bourbon Amarelo', 'Média', 'Natural', '86 pontos',
  'Notas de caramelo, avelã e frutas amarelas, com corpo aveludado e final adocicado.',
  'https://cdn.tiaxicara.com.br/produtos/reserva-mantiqueira.jpg',
  '7891234500011'
),
(
  'aaaaaaaa-0002-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Café Bourbon Amarelo',
  5290, '250g', 'Bourbon Amarelo', 'Média', 'Cereja descascado', '87 pontos',
  'Doçura de mel, notas cítricas discretas e corpo médio com final limpo.',
  'https://cdn.tiaxicara.com.br/produtos/bourbon-amarelo.jpg',
  '7891234500028'
),
(
  'aaaaaaaa-0003-4000-8000-000000000003',
  '22222222-2222-2222-2222-222222222222',
  'Café Cerrado Suave',
  3990, '250g', 'Catuaí Vermelho', 'Clara', 'Lavado', '84 pontos',
  'Notas cítricas e florais, acidez vibrante e corpo leve.',
  'https://cdn.tiaxicara.com.br/produtos/cerrado-suave.jpg',
  '7891234500035'
),
(
  'aaaaaaaa-0004-4000-8000-000000000004',
  '22222222-2222-2222-2222-222222222222',
  'Café Catuaí Vermelho',
  4490, '250g', 'Catuaí Vermelho', 'Escura', 'Natural', '83 pontos',
  'Corpo encorpado, notas de chocolate amargo e castanhas.',
  'https://cdn.tiaxicara.com.br/produtos/catuai-vermelho.jpg',
  '7891234500042'
)
ON CONFLICT (id) DO NOTHING;

-- As avaliações abaixo precisam de usuários existentes (FK user_id).
-- Como o seed roda num banco novo, criamos 3 usuários de teste só pra
-- popular as avaliações de exemplo — apague-os antes de produção.
-- A senha de todos é "Teste@1234", com hash gerado pelo próprio
-- Postgres via pgcrypto (bcrypt, custo 12 — mesmo padrão da API).
INSERT INTO users (id, email, password_hash) VALUES
  ('bbbbbbbb-0001-4000-8000-000000000001', 'marina.teste@tiaxicara.dev', crypt('Teste@1234', gen_salt('bf', 12))),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'pedro.teste@tiaxicara.dev', crypt('Teste@1234', gen_salt('bf', 12))),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'joana.teste@tiaxicara.dev', crypt('Teste@1234', gen_salt('bf', 12)))
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, nome) VALUES
  ('bbbbbbbb-0001-4000-8000-000000000001', 'Marina Souza (teste)'),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'Pedro Torra (teste)'),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'Joana Ferreira (teste)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_reviews (product_id, user_id, autor_nome, nota, comentario) VALUES
  ('aaaaaaaa-0001-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000001', 'Marina Souza (teste)', 5, 'Meu preferido do clube até agora — o aroma de caramelo é inconfundível.'),
  ('aaaaaaaa-0001-4000-8000-000000000001', 'bbbbbbbb-0002-4000-8000-000000000002', 'Pedro Torra (teste)', 5, 'Corpo aveludado mesmo, senti bem a nota de avelã no final.'),
  ('aaaaaaaa-0001-4000-8000-000000000001', 'bbbbbbbb-0003-4000-8000-000000000003', 'Joana Ferreira (teste)', 4, 'Muito bom, só achei a acidez um pouco baixa pro meu gosto.'),
  ('aaaaaaaa-0002-4000-8000-000000000002', 'bbbbbbbb-0002-4000-8000-000000000002', 'Pedro Torra (teste)', 5, 'Muito equilibrado, ótimo pra coar no V60.'),
  ('aaaaaaaa-0003-4000-8000-000000000003', 'bbbbbbbb-0001-4000-8000-000000000001', 'Marina Souza (teste)', 4, 'Bem cítrico mesmo, gostei pra tomar de manhã.'),
  ('aaaaaaaa-0004-4000-8000-000000000004', 'bbbbbbbb-0003-4000-8000-000000000003', 'Joana Ferreira (teste)', 4, 'Encorpado como eu gosto, boa pedida pra prensa francesa.')
ON CONFLICT (product_id, user_id) DO NOTHING;

-- ---------- Planos do Clube Explorador ----------
INSERT INTO subscription_plans (id, nome, gramas, preco_cents, frete, descricao, destaque, ordem) VALUES
  ('xicara', 'Clube da Xícara', 250, 4900, 'pago',
   'Café especial SCA 80+ selecionado pela Tia + guia digital de preparo', false, 1),
  ('mais-xicara', 'Clube Mais Xícara', 500, 9500, 'gratis',
   'Café especial SCA 80+ selecionado pela Tia + guia digital de preparo', true, 2),
  ('mais-xicara-premium', 'Clube Mais Xícara Premium', 750, 13500, 'gratis',
   'Café especial SCA 80+ selecionado pela Tia + guia digital de preparo', false, 3)
ON CONFLICT (id) DO NOTHING;

-- ---------- Configuração do Clube Meu Café ----------
INSERT INTO app_settings (key, value) VALUES
  ('meu_cafe_frete_gratis_acima_de_cents', '12000'),
  ('meu_cafe_quantidades_gramas', '[250, 500, 750, 1000, 1500, 2000]')
ON CONFLICT (key) DO NOTHING;

-- ---------- Posts de exemplo (Diário + Feed) ----------
INSERT INTO posts (id, user_id, autor_nome, tipo, produto_id, titulo, nota, texto, tem_foto, published_to_feed, published_to_feed_at) VALUES
  ('cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000001', 'Marina Souza (teste)', 'avaliacao',
   'aaaaaaaa-0002-4000-8000-000000000002', 'Café Bourbon Amarelo', 4, 'Latte de hoje com o Bourbon Amarelo ☕️💛 corpo aveludado e um doce de leite bem gostoso no final.', true, true, now() - interval '2 hours'),
  ('cccccccc-0002-4000-8000-000000000002', 'bbbbbbbb-0002-4000-8000-000000000002', 'Pedro Torra (teste)', 'receita',
   NULL, 'Gelado com Cerrado Suave', NULL, '40g de café, 300ml de água gelada, coado na hora e servido com bastante gelo. Refrescante pra esse calor!', false, true, now() - interval '5 hours'),
  ('cccccccc-0003-4000-8000-000000000003', 'bbbbbbbb-0003-4000-8000-000000000003', 'Joana Ferreira (teste)', 'avaliacao',
   'aaaaaaaa-0001-4000-8000-000000000001', 'Café Reserva Mantiqueira', 5, 'Comprei um pacote pra experimentar e virou favorito — corpo aveludado, super marcante.', true, false, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO post_likes (post_id, user_id) VALUES
  ('cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0002-4000-8000-000000000002'),
  ('cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0003-4000-8000-000000000003'),
  ('cccccccc-0002-4000-8000-000000000002', 'bbbbbbbb-0001-4000-8000-000000000001')
ON CONFLICT (post_id, user_id) DO NOTHING;

INSERT INTO post_comments (id, post_id, user_id, autor_nome, texto) VALUES
  ('dddddddd-0001-4000-8000-000000000001', 'cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0002-4000-8000-000000000002', 'Pedro Torra (teste)', 'Esse lote realmente surpreende, torrei um igual semana passada!'),
  ('dddddddd-0002-4000-8000-000000000002', 'cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0003-4000-8000-000000000003', 'Joana Ferreira (teste)', 'Combina bem com leite de aveia também!')
ON CONFLICT (id) DO NOTHING;
