import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { StarRating } from '../components/StarRating';
import { postApi, Post } from '../lib/postApi';
import { useAuth } from '../state/AuthContext';

export default function DiarioScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { posts: p } = await postApi.getDiario();
      setPosts(p);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  async function handlePublish(id: string) {
    setPublishingId(id);
    try {
      await postApi.publish(id);
      await load();
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Meu diário</Text>
        <Text style={styles.subtitle}>Seu registro pessoal dos cafés que tomou, comprou e das suas receitas.</Text>

        {loading && <ActivityIndicator color={colors.dourado} style={{ marginTop: spacing.xl }} />}

        {!loading && posts.length === 0 && (
          <Text style={styles.emptyText}>Seu diário está vazio.{'\n'}Toque no + pra registrar o primeiro café.</Text>
        )}

        {posts.map((post) => (
          <Card key={post.id} style={styles.entryCard}>
            <View style={styles.entryHead}>
              <Text style={styles.entryDate}>{new Date(post.created_at).toLocaleDateString('pt-BR')}</Text>
              <View style={[styles.tag, post.tipo === 'avaliacao' ? styles.tagAvaliacao : styles.tagReceita]}>
                <Text style={styles.tagText}>{post.tipo === 'avaliacao' ? 'Avaliação' : 'Receita'}</Text>
              </View>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.entryTitle}>{post.titulo}</Text>
              {post.tipo === 'avaliacao' && post.nota !== null && <StarRating value={post.nota} size={13} />}
            </View>

            {post.tem_foto && <View style={styles.photo} />}

            <Text style={styles.entryText}>{post.texto}</Text>

            <View style={styles.entryFooter}>
              {post.published_to_feed ? (
                <View style={styles.postedBadge}>
                  <Ionicons name="checkmark" size={13} color={colors.verde} />
                  <Text style={styles.postedText}>No feed</Text>
                </View>
              ) : (
                <Button
                  label="Postar no feed"
                  variant="secondary"
                  onPress={() => handlePublish(post.id)}
                  loading={publishingId === post.id}
                />
              )}
            </View>
          </Card>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('NewPost', { target: 'diario' })}>
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 100 },
  title: { ...typography.h1, color: colors.cafe },
  subtitle: { ...typography.body, color: colors.cinza, marginTop: spacing.xs, marginBottom: spacing.lg },
  emptyText: { ...typography.body, color: colors.cinza, textAlign: 'center', marginTop: spacing.xl, lineHeight: 22 },
  entryCard: { padding: spacing.md, marginBottom: spacing.md },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  entryDate: { fontSize: 11, color: colors.cinza },
  tag: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  tagAvaliacao: { backgroundColor: '#F1E6D6' },
  tagReceita: { backgroundColor: '#E7EEE4' },
  tagText: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.cafe },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  entryTitle: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 14 },
  photo: { height: 140, borderRadius: radius.sm, backgroundColor: colors.border, marginBottom: spacing.sm },
  entryText: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
  entryFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, alignItems: 'flex-end' },
  postedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  postedText: { color: colors.verde, fontFamily: fonts.bodyBold, fontSize: 12 },
  fab: {
    position: 'absolute', right: 18, bottom: 24, width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.dourado, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.cafe, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5
  }
});
