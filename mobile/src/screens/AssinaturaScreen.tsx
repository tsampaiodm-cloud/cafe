import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { subscriptionApi, ExploradorPlan, PlansResponse } from '../lib/subscriptionApi';
import { catalogApi, Product } from '../lib/catalogApi';
import { useCart, formatBRL } from '../state/CartContext';
import { ApiError } from '../lib/api';

type Aba = 'explorador' | 'meu_cafe';

function parseGramsFromPeso(peso: string): number {
  const match = peso.match(/([\d.,]+)\s*(kg|g)/i);
  if (!match) return 250;
  const value = parseFloat(match[1].replace(',', '.'));
  return match[2].toLowerCase() === 'kg' ? value * 1000 : value;
}

export default function AssinaturaScreen() {
  const { addItem } = useCart();

  const [aba, setAba] = useState<Aba>('explorador');
  const [plans, setPlans] = useState<PlansResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [produtoId, setProdutoId] = useState('');
  const [gramas, setGramas] = useState<number>(250);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [plansResult, productsResult] = await Promise.all([
          subscriptionApi.getPlans(),
          catalogApi.listProducts()
        ]);
        setPlans(plansResult);
        setProducts(productsResult.products);
        if (productsResult.products.length > 0) setProdutoId(productsResult.products[0].id);
        if (plansResult.meuCafe.quantidadesGramas.length > 0) {
          setGramas(plansResult.meuCafe.quantidadesGramas[0]);
        }
      } catch {
        setError('Não foi possível carregar os planos de assinatura.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubscribeExplorador(plan: ExploradorPlan) {
    setActionError(null);
    setSubscribingId(plan.id);
    try {
      const { subscription } = await subscriptionApi.subscribe({ tipo: 'explorador', planId: plan.id });
      addItem({
        id: `clube-${plan.id}`,
        tipo: 'assinatura',
        nome: plan.nome,
        detalhe: `${plan.gramas}g/mês · ${subscription.frete === 'gratis' ? 'frete grátis' : 'frete pago pelo assinante'}`,
        precoCents: subscription.preco_cents,
        unico: true
      });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Não foi possível assinar esse plano.');
    } finally {
      setSubscribingId(null);
    }
  }

  async function handleSubscribeMeuCafe() {
    if (!produtoId) return;
    setActionError(null);
    setSubscribingId('meu_cafe');
    try {
      const { subscription } = await subscriptionApi.subscribe({ tipo: 'meu_cafe', productId: produtoId, gramas });
      const produto = products.find((p) => p.id === produtoId);
      const label = gramas >= 1000 ? `${gramas / 1000}kg` : `${gramas}g`;
      addItem({
        id: `meucafe-${produtoId}-${gramas}`,
        tipo: 'assinatura',
        nome: `Assinatura · ${produto?.nome ?? 'Café'}`,
        detalhe: `${label}/mês · Clube Meu Café`,
        precoCents: subscription.preco_cents,
        unico: true
      });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Não foi possível criar essa assinatura.');
    } finally {
      setSubscribingId(null);
    }
  }

  const produtoSelecionado = products.find((p) => p.id === produtoId);
  const estimativaCents = produtoSelecionado
    ? Math.round((produtoSelecionado.preco_cents / (parseGramsFromPeso(produtoSelecionado.peso) / 250)) * (gramas / 250))
    : 0;
  const freteGratisMinimo = plans?.meuCafe.freteGratisAcimaDeCents ?? 12000;
  const faltaParaFreteGratis = freteGratisMinimo - estimativaCents;

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Assinatura</Text>
        <Text style={styles.subtitle}>Receba cafés especiais em casa, todo mês, sem se preocupar.</Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tabBtn, aba === 'explorador' && styles.tabBtnActive]}
            onPress={() => setAba('explorador')}
          >
            <Text style={[styles.tabText, aba === 'explorador' && styles.tabTextActive]}>Clube Explorador</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, aba === 'meu_cafe' && styles.tabBtnActive]}
            onPress={() => setAba('meu_cafe')}
          >
            <Text style={[styles.tabText, aba === 'meu_cafe' && styles.tabTextActive]}>Clube Meu Café</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator color={colors.dourado} style={{ marginTop: spacing.xl }} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {actionError && <Text style={styles.errorText}>{actionError}</Text>}

        {!loading && !error && aba === 'explorador' && plans && (
          <>
            <Text style={styles.introText}>A Tia seleciona o café especial do mês pra você — é só escolher a quantidade.</Text>
            {plans.exploradorPlans.map((plan) => (
              <Card key={plan.id} style={styles.planCard}>
                {plan.destaque && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Mais popular</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.nome}</Text>
                <Text style={styles.planPrice}>
                  {formatBRL(plan.preco_cents)} <Text style={styles.planPriceUnit}>/ mês</Text>
                </Text>
                <View style={[styles.freightChip, plan.frete === 'gratis' ? styles.freightFree : styles.freightPaid]}>
                  <Text style={[styles.freightText, plan.frete === 'gratis' && { color: colors.verde }]}>
                    {plan.frete === 'gratis' ? 'Frete grátis' : 'Frete pago pelo assinante'}
                  </Text>
                </View>
                <Text style={styles.planDesc}>{plan.gramas}g de café especial por mês · {plan.descricao}</Text>
                <Button
                  label="Assinar agora"
                  onPress={() => handleSubscribeExplorador(plan)}
                  loading={subscribingId === plan.id}
                  fullWidth
                />
              </Card>
            ))}
          </>
        )}

        {!loading && !error && aba === 'meu_cafe' && plans && (
          <>
            <Text style={styles.introText}>Monte sua assinatura com o café que você já ama, na quantidade que quiser.</Text>
            <Card style={styles.builderCard}>
              <Text style={styles.fieldLabel}>Escolha o café</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={produtoId} onValueChange={setProdutoId} style={styles.picker}>
                  {products.map((p) => (
                    <Picker.Item key={p.id} label={p.nome} value={p.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.fieldLabel}>Quantidade mensal</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={gramas} onValueChange={(v) => setGramas(Number(v))} style={styles.picker}>
                  {plans.meuCafe.quantidadesGramas.map((g) => (
                    <Picker.Item key={g} label={g >= 1000 ? `${g / 1000}kg por mês` : `${g}g por mês`} value={g} />
                  ))}
                </Picker>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTotal}>{formatBRL(estimativaCents)}</Text>
                <Text style={styles.summaryUnit}>por mês (estimativa)</Text>
                <Text style={[styles.summaryFreight, faltaParaFreteGratis <= 0 && styles.summaryFreightFree]}>
                  {faltaParaFreteGratis <= 0
                    ? 'Frete grátis nessa assinatura 🎉'
                    : `Faltam ${formatBRL(faltaParaFreteGratis)} para o frete grátis (a partir de ${formatBRL(freteGratisMinimo)})`}
                </Text>
              </View>

              <Button
                label="Assinar meu café"
                onPress={handleSubscribeMeuCafe}
                loading={subscribingId === 'meu_cafe'}
                fullWidth
              />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  title: { ...typography.h1, color: colors.cafe },
  subtitle: { ...typography.body, color: colors.cinza, marginTop: spacing.xs, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', backgroundColor: '#F1E6D6', borderRadius: radius.pill, padding: 4, marginBottom: spacing.md },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.cafe },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.cafe },
  tabTextActive: { color: '#fff' },
  introText: { ...typography.bodySmall, color: colors.cinza, marginBottom: spacing.md, lineHeight: 19 },
  errorText: { color: colors.vermelho, ...typography.body, textAlign: 'center', marginVertical: spacing.md },
  planCard: { padding: spacing.lg, marginBottom: spacing.md },
  badge: {
    alignSelf: 'flex-start', backgroundColor: colors.vermelho, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: spacing.sm
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bodyBold, textTransform: 'uppercase' },
  planName: { ...typography.h3, color: colors.cafe, marginBottom: 4 },
  planPrice: { ...typography.h2, color: colors.dourado, marginBottom: spacing.sm },
  planPriceUnit: { fontSize: 13, color: colors.cinza, fontFamily: fonts.body },
  freightChip: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: spacing.sm },
  freightFree: { backgroundColor: '#E7EEE4' },
  freightPaid: { backgroundColor: '#F1E6D6' },
  freightText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.cafe },
  planDesc: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 19 },
  builderCard: { padding: spacing.lg, gap: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.cafe, marginTop: spacing.sm, marginBottom: 4 },
  pickerWrap: { borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#fff', overflow: 'hidden' },
  picker: Platform.select({ web: { height: 40, paddingHorizontal: 8 }, default: {} }) as object,
  summaryBox: {
    backgroundColor: '#FBF6EF', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginVertical: spacing.md
  },
  summaryTotal: { ...typography.h2, color: colors.dourado },
  summaryUnit: { ...typography.bodySmall, color: colors.cinza, marginBottom: spacing.xs },
  summaryFreight: { ...typography.bodySmall, color: colors.cinza, textAlign: 'center', marginTop: spacing.xs },
  summaryFreightFree: { color: colors.verde, fontFamily: fonts.bodyBold }
});
