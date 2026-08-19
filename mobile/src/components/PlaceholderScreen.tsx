import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { TopBar } from './TopBar';

type Props = {
  title: string;
  description: string;
  portingNote: string;
};

/**
 * Usada pelas telas ainda não portadas do protótipo em HTML (Assinatura,
 * Direto do Produtor, Feed, Diário, Trilhas, Scanner). O objetivo aqui
 * não é reimplementar tudo de uma vez, e sim já deixar a navegação, o
 * tema visual e a barra superior funcionando — cada `portingNote`
 * aponta exatamente qual parte do protótipo HTML tem a referência de
 * layout/conteúdo pra portar pra esta tela.
 */
export function PlaceholderScreen({ title, description, portingNote }: Props) {
  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Pendente de portar</Text>
          <Text style={styles.noteText}>{portingNote}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  title: { ...typography.h1, color: colors.cafe },
  description: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl },
  noteBox: {
    borderWidth: 1.4,
    borderColor: colors.dourado,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: '#FBF6EF'
  },
  noteLabel: { ...typography.label, color: colors.dourado, marginBottom: spacing.xs },
  noteText: { ...typography.bodySmall, color: colors.textMuted, lineHeight: 19 }
});
