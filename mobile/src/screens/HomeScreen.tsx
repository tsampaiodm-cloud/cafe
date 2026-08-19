import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../state/AuthContext';
import { Button } from '../components/Button';

const heroPlaceholder = require('../../assets/splash.png');

// TODO(Fase 2 do roteiro): "café do mês" e os atalhos abaixo ainda são
// conteúdo fixo, igual ao protótipo em HTML. Quando a API de catálogo
// existir, troque por um fetch em GET /api/catalogo/destaque (ou
// endpoint equivalente) e mantenha o mesmo layout.
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const primeiroNome = (profile?.nome || 'Marina').split(' ')[0];

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Bem-vinda, {primeiroNome}</Text>
        <Text style={styles.script}>seu cantinho cafeeiro</Text>

        <Image source={heroPlaceholder} style={styles.hero} />

        <Text style={styles.welcomeText}>
          Que bom te ver por aqui! Descubra cafés especiais selecionados a dedo, direto das
          fazendas parceiras até a sua xícara.
        </Text>

        <Text style={styles.sectionTitle}>Café do mês</Text>
        <Card style={styles.monthCard}>
          <View style={styles.monthCardBody}>
            <Text style={styles.monthCoffeeName}>Café Reserva Mantiqueira</Text>
            <Text style={styles.monthSpec}>BOURBON AMARELO · TORRA MÉDIA · 250G</Text>
            <Text style={styles.monthNotes}>
              Notas de caramelo, avelã e frutas amarelas, com corpo aveludado e final adocicado.
            </Text>
            <Button label="Ver na Loja" variant="secondary" onPress={() => navigation.navigate('Loja')} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Explore o app</Text>
        <View style={styles.shortcutGrid}>
          {[
            { label: 'Loja', screen: 'Loja' },
            { label: 'Assinatura', screen: 'Assinatura' },
            { label: 'Direto do Produtor', screen: 'Produtor' },
            { label: 'Feed', screen: 'Feed' },
            { label: 'Meu Diário', screen: 'Diario' },
            { label: 'Trilhas', screen: 'Trilhas' }
          ].map((item) => (
            <Card key={item.screen} style={styles.shortcutCard}>
              <Text style={styles.shortcutLabel} onPress={() => navigation.navigate(item.screen)}>
                {item.label}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  greeting: { ...typography.h1, color: colors.cafe },
  script: { fontFamily: fonts.script, fontSize: 20, color: colors.dourado, marginTop: 2, marginBottom: spacing.lg },
  hero: { width: '100%', height: 180, borderRadius: radius.lg, marginBottom: spacing.lg },
  welcomeText: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 22 },
  sectionTitle: { ...typography.h2, color: colors.cafe, marginBottom: spacing.sm },
  monthCard: { marginBottom: spacing.xl },
  monthCardBody: { padding: spacing.lg, gap: spacing.sm },
  monthCoffeeName: { ...typography.h3, color: colors.cafe },
  monthSpec: { ...typography.label, color: colors.cinza },
  monthNotes: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 20 },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shortcutCard: { width: '47%', paddingVertical: spacing.lg, alignItems: 'center' },
  shortcutLabel: { ...typography.bodySmall, color: colors.cafe, fontFamily: fonts.bodyBold, textAlign: 'center' }
});
