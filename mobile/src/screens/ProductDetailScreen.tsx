import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StarRating } from '../components/StarRating';
import { catalogApi, ProductDetail } from '../lib/catalogApi';
import { useCart, formatBRL } from '../state/CartContext';
import { useAuth } from '../state/AuthContext';
import { ApiError } from '../lib/api';
import { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { addItem } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { product: p } = await catalogApi.getProduct(params.id);
      setProduct(p);
    } catch {
      setError('Não foi possível carregar este café.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendReview() {
    if (!user) {
      setReviewError('Entre na sua conta para avaliar este café.');
      return;
    }
    if (nota === 0 || comentario.trim().length < 3) {
      setReviewError('Escolha uma nota e escreva um pouco sobre o café.');
      return;
    }
    setSending(true);
    setReviewError(null);
    try {
      await catalogApi.postReview(params.id, { nota, comentario: comentario.trim() });
      setNota(0);
      setComentario('');
      await load(); // recarrega pra já mostrar a nova avaliação na lista
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : 'Não foi possível enviar sua avaliação.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.dourado} size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Café não encontrado.'}</Text>
      </View>
    );
  }

  const avgRating = parseFloat(product.avg_rating) || 0;
  const reviewCount = parseInt(String(product.review_count), 10) || 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* product.foto hoje é uma URL placeholder (ver seed.sql no
          backend) — troque por <Image source={{ uri: product.foto }} />
          quando o storage de fotos reais estiver configurado. */}
      {product.foto ? (
        <View style={[styles.hero, { backgroundColor: colors.bege }]} />
      ) : (
        <View style={styles.hero} />
      )}

      <Text style={styles.title}>{product.nome}</Text>
      {product.farm_nome && (
        <Text
          style={styles.origin}
          onPress={() => product.farm_id && navigation.navigate('FarmDetail', { id: product.farm_id })}
        >
          {product.farm_nome} · {product.farm_regiao}
        </Text>
      )}

      <StarRating value={avgRating} showCount={reviewCount} />

      <Card style={styles.priceCard}>
        <Text style={styles.price}>{formatBRL(product.preco_cents)}</Text>
        <Button
          label="Adicionar ao carrinho"
          onPress={() =>
            addItem({
              id: `loja-${product.id}`,
              tipo: 'produto',
              nome: product.nome,
              detalhe: `${product.peso}${product.torra ? ` · torra ${product.torra.toLowerCase()}` : ''}`,
              precoCents: product.preco_cents
            })
          }
        />
      </Card>

      <View style={styles.specGrid}>
        <Spec label="Variedade" value={product.variedade} />
        <Spec label="Torra" value={product.torra} />
        <Spec label="Processo" value={product.processo} />
        <Spec label="Pontuação SCA" value={product.sca_score} />
      </View>

      {product.notas && (
        <>
          <Text style={styles.sectionTitle}>Notas de prova</Text>
          <Text style={styles.bodyText}>{product.notas}</Text>
        </>
      )}

      <Text style={styles.sectionTitle}>Avaliações dos clientes</Text>
      {product.avaliacoes.length === 0 ? (
        <Text style={styles.bodyText}>Ainda não há avaliações para esse café.</Text>
      ) : (
        product.avaliacoes.map((r) => (
          <Card key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHead}>
              <Text style={styles.reviewAuthor}>{r.autor_nome}</Text>
              <StarRating value={r.nota} size={12} />
            </View>
            <Text style={styles.reviewText}>{r.comentario}</Text>
          </Card>
        ))
      )}

      <Card style={styles.reviewForm}>
        <Text style={styles.formLabel}>Deixe sua avaliação</Text>
        <StarRating value={nota} onChange={setNota} size={26} />
        <TextInput
          style={styles.textarea}
          placeholder="O que você achou desse café?"
          value={comentario}
          onChangeText={setComentario}
          multiline
        />
        {reviewError && <Text style={styles.errorText}>{reviewError}</Text>}
        <Button label="Enviar avaliação" onPress={handleSendReview} loading={sending} variant="secondary" fullWidth />
      </Card>
    </ScrollView>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <Card style={styles.specItem}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.vermelho, ...typography.body, textAlign: 'center', marginTop: spacing.sm },
  hero: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.border, marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.cafe },
  origin: { ...typography.label, color: colors.verde, marginTop: spacing.xs, marginBottom: spacing.sm },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, marginVertical: spacing.md
  },
  price: { ...typography.h2, color: colors.dourado },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  specItem: { width: '47%', padding: spacing.sm },
  specLabel: { ...typography.label, color: colors.cinza, fontSize: 10 },
  specValue: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 13, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.cafe, marginTop: spacing.md, marginBottom: spacing.sm },
  bodyText: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  reviewCard: { padding: spacing.sm, marginBottom: spacing.sm },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 13 },
  reviewText: { ...typography.bodySmall, color: colors.textMuted },
  reviewForm: { padding: spacing.md, marginTop: spacing.md, gap: spacing.sm },
  formLabel: { ...typography.label, color: colors.cafe },
  textarea: {
    borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, minHeight: 70, textAlignVertical: 'top',
    fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.cafe
  }
});
