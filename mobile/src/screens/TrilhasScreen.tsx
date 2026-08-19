import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { TRILHAS } from '../data/trilhas';

export default function TrilhasScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trilhas</Text>
        <Text style={styles.subtitle}>Aprenda sobre café no seu ritmo, um tema de cada vez.</Text>

        <View style={styles.grid}>
          {TRILHAS.map((t) => (
            <Pressable key={t.id} style={styles.cardWrap} onPress={() => navigation.navigate('TrilhaDetail', { id: t.id })}>
              <Card style={styles.card}>
                <View style={styles.iconWrap}>
                  <Ionicons name={t.icone as any} size={22} color={colors.dourado} />
                </View>
                <Text style={styles.cardTitle}>{t.nome}</Text>
                <Text style={styles.cardDesc}>{t.resumo}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cardWrap: { width: '47%' },
  card: { padding: spacing.md, alignItems: 'center' },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: '#F1E6D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  cardTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.cafe, textAlign: 'center', marginBottom: 4 },
  cardDesc: { ...typography.bodySmall, fontSize: 11, color: colors.cinza, textAlign: 'center', lineHeight: 15 }
});
