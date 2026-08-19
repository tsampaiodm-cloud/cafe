export type TrilhaItem = { titulo: string; texto: string };
export type Trilha = {
  id: string;
  nome: string;
  resumo: string;
  icone: string; // nome do ícone Ionicons
  conteudo: TrilhaItem[];
};

export const TRILHAS: Trilha[] = [
  {
    id: 'historia',
    nome: 'História do Café',
    resumo: 'Da Etiópia até a sua xícara.',
    icone: 'time-outline',
    conteudo: [
      {
        titulo: 'A lenda de Kaldi',
        texto:
          'Reza a lenda que um pastor de cabras etíope percebeu que seu rebanho ficava agitado depois de comer os frutos vermelhos de um arbusto — os primeiros grãos de café conhecidos.'
      },
      {
        titulo: 'A chegada ao Brasil',
        texto:
          'O café chegou ao Brasil no século 18 e, com o tempo, o país se tornou o maior produtor do mundo, com regiões como Minas Gerais e o Cerrado formando a base da produção especial de hoje.'
      },
      {
        titulo: 'Da commodity ao café especial',
        texto:
          'Nas últimas décadas, produtores passaram a focar em qualidade em vez de apenas volume — nascia o movimento de cafés especiais, com rastreabilidade e processos cuidadosos do plantio à xícara.'
      }
    ]
  },
  {
    id: 'tipos-cafe',
    nome: 'Tipos de Café',
    resumo: 'Arábica, robusta e as principais variedades.',
    icone: 'leaf-outline',
    conteudo: [
      {
        titulo: 'Arábica',
        texto:
          'Representa a maioria dos cafés especiais. Cultivado em altitude, tem mais acidez e complexidade de sabor, com menos cafeína que o robusta.'
      },
      {
        titulo: 'Robusta (Conilon)',
        texto:
          'Mais resistente e encorpado, com mais cafeína e notas mais amargas. Muito usado em blends e no café solúvel.'
      },
      {
        titulo: 'Variedades',
        texto:
          'Dentro do arábica, variedades como Bourbon, Catuaí, Mundo Novo e Icatu mudam o corpo, a doçura e a acidez da xícara final.'
      }
    ]
  },
  {
    id: 'metodos-preparo',
    nome: 'Métodos de Preparo',
    resumo: 'V60, prensa francesa, espresso e mais.',
    icone: 'water-outline',
    conteudo: [
      {
        titulo: 'V60 (coado)',
        texto:
          'Método manual que realça acidez e notas florais/frutadas. Água em torno de 92-96°C, despejada em círculos lentos sobre o filtro.'
      },
      {
        titulo: 'Prensa francesa',
        texto:
          'Imersão total do pó na água por cerca de 4 minutos antes de prensar. Resulta em corpo mais encorpado e sabor intenso.'
      },
      {
        titulo: 'Espresso',
        texto:
          'Água pressurizada passa rapidamente pelo pó bem fino, extraindo um café concentrado e encorpado, base de praticamente todas as bebidas de cafeteria.'
      },
      {
        titulo: 'Aeropress',
        texto:
          'Combina imersão e pressão manual, é rápido, versátil e produz uma xícara limpa, entre o coado e o espresso.'
      }
    ]
  },
  {
    id: 'tipos-moagem',
    nome: 'Tipos de Moagem',
    resumo: 'Grossa, média ou fina — e por que isso importa.',
    icone: 'apps-outline',
    conteudo: [
      {
        titulo: 'Moagem grossa',
        texto:
          'Ideal para prensa francesa e cold brew — grãos maiores evitam excesso de extração em tempos de contato mais longos.'
      },
      {
        titulo: 'Moagem média',
        texto: 'Usada em métodos coados como V60 e Kalita, equilibrando tempo de extração e fluxo de água.'
      },
      {
        titulo: 'Moagem fina',
        texto:
          'Necessária para o espresso, onde a água passa rápido e sob pressão — grãos finos garantem extração completa nesse tempo curto.'
      }
    ]
  },
  {
    id: 'torra-abic',
    nome: 'Torra e Classificação ABIC',
    resumo: 'Torra clara, média, escura e o selo de pureza.',
    icone: 'flame-outline',
    conteudo: [
      {
        titulo: 'Torra clara',
        texto: 'Preserva mais acidez e notas florais/frutadas de origem. Grão mais claro, com menos óleo na superfície.'
      },
      {
        titulo: 'Torra média',
        texto:
          'Equilíbrio entre acidez e corpo, com notas de caramelo e frutas maduras — a mais comum entre cafés especiais.'
      },
      {
        titulo: 'Torra escura',
        texto: 'Mais corpo e amargor, notas de chocolate amargo e especiarias, com menos acidez perceptível.'
      },
      {
        titulo: 'Selo ABIC',
        texto:
          'A Associação Brasileira da Indústria de Café certifica a pureza do café torrado e moído vendido no Brasil, garantindo que o produto não tem misturas como milho ou cevada.'
      }
    ]
  },
  {
    id: 'curiosidades',
    nome: 'Curiosidades',
    resumo: 'Fatos curiosos pra impressionar na roda de café.',
    icone: 'bulb-outline',
    conteudo: [
      {
        titulo: 'O café é uma fruta',
        texto: 'O grão que torramos é, na verdade, a semente de uma fruta chamada cereja de café.'
      },
      {
        titulo: 'Segunda bebida mais consumida',
        texto:
          'Depois da água, o café é a bebida mais consumida no mundo — e o Brasil é o maior produtor e o segundo maior consumidor.'
      },
      {
        titulo: 'Cafés descafeinados têm cafeína',
        texto:
          'O processo de descafeinização remove cerca de 97% da cafeína, mas não 100% — uma xícara ainda tem uma pequena quantidade.'
      }
    ]
  },
  {
    id: 'receitas',
    nome: 'Receitas',
    resumo: 'Ideias além do café coado tradicional.',
    icone: 'restaurant-outline',
    conteudo: [
      {
        titulo: 'Café gelado (cold brew simples)',
        texto:
          '40g de café moído grosso + 400ml de água gelada, deixe em infusão na geladeira por 12h, coe e sirva com gelo.'
      },
      {
        titulo: 'Latte em casa',
        texto: 'Prepare um espresso ou café bem concentrado, aqueça e espume o leite, e despeje devagar por cima para criar camadas.'
      },
      {
        titulo: 'Café com especiarias',
        texto: 'Adicione uma pitada de canela ou cardamomo ao pó antes de coar para um toque aromático diferente.'
      }
    ]
  }
];

export function findTrilha(id: string): Trilha | undefined {
  return TRILHAS.find((t) => t.id === id);
}
