import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useCart, formatBRL } from '../state/CartContext';
import { ApiError } from '../lib/api';

export default function CartScreen() {
  const { items, removeItem, changeQuantity, totalCents, checkout } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
    setLoading(true);
    try {
      const { checkoutUrl } = await checkout();
      // Abre a URL de Checkout do Stripe — no navegador troca a aba
      // de verdade; no app mobile abre no navegador padrão do sistema
      // (fluxo comum pra checkout de pagamento fora do app).
      await Linking.openURL(checkoutUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível iniciar o pagamento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Meu carrinho</Text>

        {items.length === 0 ? (
          <Text style={styles.empty}>Seu carrinho está vazio.</Text>
        ) : (
          items.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <Text style={styles.itemDetail}>{item.detalhe}</Text>
                <Text style={styles.itemPrice}>{formatBRL(item.precoCents * item.quantidade)}</Text>
              </View>

              {item.unico ? (
                <Pressable onPress={() => removeItem(item.id)}>
                  <Text style={styles.remove}>Remover</Text>
                </Pressable>
              ) : (
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qtyBtn} onPress={() => changeQuantity(item.id, -1)}>
                    <Text>−</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{item.quantidade}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => changeQuantity(item.id, 1)}>
                    <Text>+</Text>
                  </Pressable>
                </View>
              )}
            </Card>
          ))
        )}

        {items.length > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatBRL(totalCents)}</Text>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Button label="Finalizar compra" onPress={handleCheckout} loading={loading} fullWidth />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: 40 },
  title: { ...typography.h1, color: colors.cafe, marginBottom: spacing.lg },
  empty: { ...typography.body, color: colors.cinza, textAlign: 'center', marginTop: 40 },
  itemCard: { flexDirection: 'row', padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center' },
  itemName: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 14 },
  itemDetail: { ...typography.bodySmall, color: colors.cinza, fontSize: 11, marginTop: 2 },
  itemPrice: { fontFamily: fonts.bodyBold, color: colors.dourado, fontSize: 13, marginTop: 4 },
  remove: { color: colors.vermelho, fontSize: 12, fontFamily: fonts.bodyBold },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center'
  },
  qtyValue: { fontFamily: fonts.bodyBold, color: colors.cafe },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginVertical: spacing.lg
  },
  totalLabel: { ...typography.body, color: colors.cinza },
  totalValue: { ...typography.h2, color: colors.dourado },
  error: { color: colors.vermelho, ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.md }
});
