import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { StarRating } from '../components/StarRating';
import { useCart, formatBRL } from '../state/CartContext';
import { catalogApi, Product } from '../lib/catalogApi';

export default function LojaScreen() {
  const navigation = useNavigation<any>();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await catalogApi.listProducts();
      setProducts(result.products);
    } catch {
      setError('Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Loja</Text>
        <Text style={styles.subtitle}>Cafés especiais prontos para envio, selecionados pela Tia Xícara.</Text>

        {loading && <ActivityIndicator color={colors.dourado} style={{ marginTop: spacing.xl }} />}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.grid}>
          {products.map((p) => (
            <Pressable key={p.id} onPress={() => navigation.navigate('ProductDetail', { id: p.id })} style={styles.cardWrap}>
              <Card style={styles.productCard}>
                <View style={styles.swatch}>
                  <Text style={{ fontSize: 26 }}>☕</Text>
                </View>
                <Text style={styles.productName}>{p.nome.replace('Café ', '')}</Text>
                <Text style={styles.productDetail}>
                  {p.peso}
                  {p.torra ? ` · torra ${p.torra.toLowerCase()}` : ''}
                </Text>
                <StarRating
                  value={parseFloat(p.avg_rating) || 0}
                  size={11}
                  showCount={parseInt(String(p.review_count), 10) || 0}
                />
                <Text style={styles.productPrice}>{formatBRL(p.preco_cents)}</Text>
                <Pressable
                  style={styles.addBtn}
                  onPress={() =>
                    addItem({
                      id: `loja-${p.id}`,
                      tipo: 'produto',
                      nome: p.nome.replace('Café ', ''),
                      detalhe: `${p.peso}${p.torra ? ` · torra ${p.torra.toLowerCase()}` : ''}`,
                      precoCents: p.preco_cents
                    })
                  }
                >
                  <Text style={styles.addBtnText}>Adicionar</Text>
                </Pressable>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  title: { ...typography.h1, color: colors.cafe },
  subtitle: { ...typography.body, color: colors.cinza, marginTop: spacing.xs, marginBottom: spacing.lg },
  errorText: { color: colors.vermelho, ...typography.body, textAlign: 'center', marginTop: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cardWrap: { width: '47%' },
  productCard: { padding: spacing.md, gap: 4 },
  swatch: {
    height: 78,
    borderRadius: radius.sm,
    backgroundColor: colors.bege,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  productName: { ...typography.h3, color: colors.cafe, fontSize: 15 },
  productDetail: { ...typography.bodySmall, color: colors.cinza, fontSize: 11 },
  productPrice: { fontFamily: fonts.bodyBold, color: colors.dourado, fontSize: 14, marginVertical: 4 },
  addBtn: { borderWidth: 1.4, borderColor: colors.dourado, borderRadius: radius.pill, paddingVertical: 8, alignItems: 'center' },
  addBtnText: { color: colors.dourado, fontFamily: fonts.bodyBold, fontSize: 12.5 }
});
