import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { StarRating } from '../components/StarRating';
import { postApi, Comment, PostDetail } from '../lib/postApi';
import { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen() {
  const { params } = useRoute<Route>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { post: p } = await postApi.getPost(params.id);
      setPost(p);
      setLikeCount(parseInt(String(p.like_count), 10) || 0);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleLike() {
    // otimista: atualiza a tela antes da resposta do servidor voltar
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    try {
      await postApi.toggleLike(params.id);
    } catch {
      // reverte se der erro
      setLiked((v) => !v);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
    }
  }

  async function handleSendComment() {
    if (commentText.trim().length === 0) return;
    setSending(true);
    try {
      await postApi.comment(params.id, commentText.trim());
      setCommentText('');
      await load();
    } finally {
      setSending(false);
    }
  }

  async function handleSendReply(parentId: string) {
    if (replyText.trim().length === 0) return;
    setSending(true);
    try {
      await postApi.comment(params.id, replyText.trim(), parentId);
      setReplyText('');
      setReplyingTo(null);
      await load();
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.dourado} size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Post não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
          {post.tipo === 'avaliacao' && post.nota !== null && <StarRating value={post.nota} size={14} />}
        </View>

        {post.tem_foto && <View style={styles.photo} />}

        <Text style={styles.postText}>{post.texto}</Text>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={handleToggleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.vermelho : colors.cinza} />
            <Text style={[styles.actionText, liked && { color: colors.vermelho }]}>{likeCount}</Text>
          </Pressable>
          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.cinza} />
            <Text style={styles.actionText}>{post.comments.length} comentários</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Comentários</Text>

      {post.comments.length === 0 && <Text style={styles.emptyText}>Seja o primeiro a comentar.</Text>}

      {post.comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
          onSendReply={handleSendReply}
          sending={sending}
        />
      ))}

      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Escreva um comentário..."
          value={commentText}
          onChangeText={setCommentText}
        />
        <Pressable style={styles.sendBtn} onPress={handleSendComment} disabled={sending}>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function CommentItem({
  comment,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onSendReply,
  sending,
  depth = 0
}: {
  comment: Comment;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (v: string) => void;
  onSendReply: (parentId: string) => void;
  sending: boolean;
  depth?: number;
}) {
  const isReplying = replyingTo === comment.id;
  return (
    <View style={{ marginLeft: depth * 20, marginBottom: spacing.sm }}>
      <View style={styles.commentRow}>
        <View style={styles.commentAvatar} />
        <View style={{ flex: 1 }}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>{comment.autor_nome}</Text>
            <Text style={styles.commentText}>{comment.texto}</Text>
          </View>
          <View style={styles.commentMetaRow}>
            <Text style={styles.commentTime}>{new Date(comment.created_at).toLocaleDateString('pt-BR')}</Text>
            <Pressable onPress={() => setReplyingTo(isReplying ? null : comment.id)}>
              <Text style={styles.replyLink}>Responder</Text>
            </Pressable>
          </View>

          {isReplying && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder={`Respondendo a ${comment.autor_nome}...`}
                value={replyText}
                onChangeText={setReplyText}
              />
              <Pressable style={styles.sendBtn} onPress={() => onSendReply(comment.id)} disabled={sending}>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {comment.replies.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
          onSendReply={onSendReply}
          sending={sending}
          depth={depth + 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.vermelho, ...typography.body },
  postCard: { padding: spacing.md, marginBottom: spacing.lg },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.dourado },
  autor: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 13.5 },
  tempo: { fontSize: 11, color: colors.cinza },
  tag: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  tagAvaliacao: { backgroundColor: '#F1E6D6' },
  tagReceita: { backgroundColor: '#E7EEE4' },
  tagText: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.cafe },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  postTitle: { fontFamily: fonts.bodyBold, color: colors.cafe, fontSize: 14 },
  photo: { height: 160, borderRadius: radius.sm, backgroundColor: colors.border, marginBottom: spacing.sm },
  postText: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, color: colors.cinza, fontFamily: fonts.bodyBold },
  sectionTitle: { ...typography.h3, color: colors.cafe, marginBottom: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.cinza, marginBottom: spacing.md },
  commentRow: { flexDirection: 'row', gap: spacing.sm },
  commentAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.verde },
  commentBubble: { backgroundColor: '#F8F1E7', borderRadius: 12, padding: 10 },
  commentAuthor: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.cafe },
  commentText: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  commentMetaRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginLeft: 2 },
  commentTime: { fontSize: 10.5, color: colors.cinza },
  replyLink: { fontSize: 10.5, fontFamily: fonts.bodyBold, color: colors.cafe },
  commentInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
  commentInput: {
    flex: 1, borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 9, backgroundColor: '#fff',
    fontFamily: typography.body.fontFamily, fontSize: 12.5, color: colors.cafe
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.dourado,
    alignItems: 'center', justifyContent: 'center'
  }
});
