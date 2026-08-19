import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { StarRating } from '../components/StarRating';
import { postApi, Post } from '../lib/postApi';

type Filtro = 'todos' | 'avaliacao' | 'receita';

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { posts: p } = await postApi.getFeed(filtro === 'todos' ? undefined : filtro);
      setPosts(p);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.subtitle}>Avaliações, receitas e conversas da comunidade Tia Xícara.</Text>

        <View style={styles.chips}>
          {(['todos', 'avaliacao', 'receita'] as Filtro[]).map((f) => (
            <Pressable key={f} style={[styles.chip, filtro === f && styles.chipActive]} onPress={() => setFiltro(f)}>
              <Text style={[styles.chipText, filtro === f && styles.chipTextActive]}>
                {f === 'todos' ? 'Todos' : f === 'avaliacao' ? 'Avaliações' : 'Receitas'}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading && <ActivityIndicator color={colors.dourado} style={{ marginTop: spacing.xl }} />}

        {!loading && posts.length === 0 && <Text style={styles.emptyText}>Ainda não há posts por aqui.</Text>}

        {posts.map((post) => (
          <Pressable key={post.id} onPress={() => navigation.navigate('PostDetail', { id: post.id })}>
            <Card style={styles.postCard}>
              <View style={styles.postHead}>
                <View style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.autor}>{post.autor_nome}</Text>
                  <Text style={styles.tempo}>{new Date(post.created_at).toLocaleDateString('pt-BR')}</Text>
                </View>
                <View style={[styles.tag, post.tipo === 'avaliacao' ? styles.tagAvaliacao : styles.tagReceita]}>
                  <Text style={styles.tagText}>{post.tipo === 'avaliacao' ? 'Avaliação' : 'Receita'}</Text>
                </View>
              </View>

              <View style={styles.titleRow}>
                <Text style={styles.postTitle}>{post.titulo}</Text>
                {post.tipo === 'avaliacao' && post.nota !== null && <StarRating value={post.nota} size={13} />}
              </View>

              {post.tem_foto && <View style={styles.photo} />}

              <Text style={styles.postText} numberOfLines={3}>
                {post.texto}
              </Text>

              <View style={styles.actionsRow}>
                <View style={styles.actionBtn}>
                  <Ionicons name="heart-outline" size={16} color={colors.cinza} />
                  <Text style={styles.actionText}>{post.like_count}</Text>
                </View>
                <View style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={15} color={colors.cinza} />
                  <Text style={styles.actionText}>{post.comment_count} comentários</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('NewPost', { target: 'feed' })}>
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 100 },
  title: { ...typography.h1, color: colors.cafe },
  subtitle: { ...typography.body, color: colors.cinza, marginTop: spacing.xs, marginBottom: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  chip: { borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.cafe, borderColor: colors.cafe },
  chipText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.cafe },
  chipTextActive: { color: '#fff' },
  emptyText: { ...typography.body, color: colors.cinza, textAlign: 'center', marginTop: spacing.xl },
  postCard: { padding: spacing.md, marginBottom: spacing.md },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.dourado },
  autor: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 13 },
  tempo: { fontSize: 10.5, color: colors.cinza },
  tag: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  tagAvaliacao: { backgroundColor: '#F1E6D6' },
  tagReceita: { backgroundColor: '#E7EEE4' },
  tagText: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.cafe },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  postTitle: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 13.5 },
  photo: { height: 130, borderRadius: radius.sm, backgroundColor: colors.border, marginBottom: spacing.sm },
  postText: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 19 },
  actionsRow: { flexDirection: 'row', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 11.5, color: colors.cinza, fontFamily: fonts.bodyBold },
  fab: {
    position: 'absolute', right: 18, bottom: 24, width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.dourado, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.cafe, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5
  }
});
