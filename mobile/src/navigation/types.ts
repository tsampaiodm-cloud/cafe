export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Loja: undefined;
  Assinatura: undefined;
  Produtor: undefined;
  Scanner: undefined;
  Feed: undefined;
  Diario: undefined;
  Trilhas: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Cart: undefined;
  Profile: undefined;
  FarmDetail: { id: string };
  ProductDetail: { id: string };
  TrilhaDetail: { id: string };
  NewPost: { target: 'feed' | 'diario' };
  PostDetail: { id: string };
};
