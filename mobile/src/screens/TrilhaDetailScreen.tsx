import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Card } from '../components/Card';
import { findTrilha } from '../data/trilhas';
import { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TrilhaDetail'>;

export default function TrilhaDetailScreen() {
  const { params } = useRoute<Route>();
  const trilha = findTrilha(params.id);

  if (!trilha) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Conteúdo não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{trilha.nome}</Text>
      <Text style={styles.subtitle}>{trilha.resumo}</Text>

      {trilha.conteudo.map((item, i) => (
        <Card key={i} style={styles.itemCard}>
          <Text style={styles.itemTitle}>{item.titulo}</Text>
          <Text style={styles.itemText}>{item.texto}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: 50 },
  center: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.vermelho, ...typography.body },
  title: { ...typography.h1, color: colors.cafe },
  subtitle: { ...typography.body, color: colors.cinza, marginTop: spacing.xs, marginBottom: spacing.lg },
  itemCard: { padding: spacing.md, marginBottom: spacing.sm },
  itemTitle: { ...typography.h3, color: colors.cafe, marginBottom: spacing.xs },
  itemText: { ...typography.body, color: colors.textMuted, lineHeight: 21 }
});
