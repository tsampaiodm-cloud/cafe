import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { StarRating } from '../components/StarRating';
import { catalogApi, FarmDetail } from '../lib/catalogApi';
import { formatBRL } from '../state/CartContext';
import { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'FarmDetail'>;

export default function FarmDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<any>();

  const [farm, setFarm] = useState<FarmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { farm: f } = await catalogApi.getFarm(params.id);
        setFarm(f);
      } catch {
        setError('Não foi possível carregar esta fazenda.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.dourado} size="large" />
      </View>
    );
  }

  if (error || !farm) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Fazenda não encontrada.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* farm.hero_foto/fotos hoje apontam pra URLs placeholder (ver
          seed.sql no backend) — por isso blocos de cor em vez de
          <Image>. Troque por <Image source={{ uri: farm.hero_foto }} />
          quando o storage de fotos reais estiver configurado (Fase 6
          do roteiro). */}
      <View style={styles.hero} />

      {farm.fotos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {farm.fotos.map((_, i) => (
            <View key={i} style={styles.galleryTile} />
          ))}
        </ScrollView>
      )}

      <Text style={styles.title}>{farm.nome}</Text>
      <Text style={styles.origin}>
        {farm.regiao} · {farm.produtor}
      </Text>

      {farm.certificacoes.length > 0 && (
        <View style={styles.certRow}>
          {farm.certificacoes.map((c) => (
            <View key={c} style={styles.certChip}>
              <Text style={styles.certText}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>A história por trás do café</Text>
      {farm.historia.map((par, i) => (
        <Text key={i} style={styles.bodyText}>
          {par}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Cafés dessa fazenda</Text>
      {farm.produtos.map((p) => (
        <Pressable key={p.id} onPress={() => navigation.navigate('ProductDetail', { id: p.id })}>
          <Card style={styles.productRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{p.nome}</Text>
              <StarRating value={parseFloat(p.avg_rating) || 0} size={12} showCount={parseInt(String(p.review_count), 10) || 0} />
            </View>
            <Text style={styles.productPrice}>{formatBRL(p.preco_cents)}</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.vermelho, ...typography.body, textAlign: 'center' },
  hero: { width: '100%', height: 190, borderRadius: radius.lg, backgroundColor: colors.border, marginBottom: spacing.sm },
  gallery: { marginBottom: spacing.md },
  galleryTile: { width: 100, height: 76, borderRadius: radius.sm, backgroundColor: colors.bege, marginRight: spacing.sm },
  title: { ...typography.h1, color: colors.cafe },
  origin: { ...typography.label, color: colors.verde, marginTop: spacing.xs, marginBottom: spacing.sm },
  certRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  certChip: { backgroundColor: '#E7EEE4', borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 10 },
  certText: { color: colors.verde, fontFamily: fonts.bodyBold, fontSize: 11 },
  sectionTitle: { ...typography.h3, color: colors.cafe, marginTop: spacing.md, marginBottom: spacing.sm },
  bodyText: { ...typography.body, color: colors.textMuted, lineHeight: 21, marginBottom: spacing.sm },
  productRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, marginBottom: spacing.sm
  },
  productName: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 14, marginBottom: 4 },
  productPrice: { fontFamily: fonts.bodyBold, color: colors.dourado, fontSize: 14 }
});
