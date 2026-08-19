import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Button } from '../components/Button';
import { StarRating } from '../components/StarRating';
import { catalogApi, Product } from '../lib/catalogApi';
import { postApi } from '../lib/postApi';
import { ApiError } from '../lib/api';
import { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'NewPost'>;
type Tipo = 'avaliacao' | 'receita';

export default function NewPostScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<Route>();
  const isFeed = params.target === 'feed';

  const [tipo, setTipo] = useState<Tipo>('avaliacao');
  const [products, setProducts] = useState<Product[]>([]);
  const [produtoId, setProdutoId] = useState('');
  const [nota, setNota] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [temFoto, setTemFoto] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogApi
      .listProducts()
      .then((r) => {
        setProducts(r.products);
        if (r.products.length > 0) setProdutoId(r.products[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    setError(null);
    if (texto.trim().length < 3) {
      setError('Escreva um pouco mais antes de publicar.');
      return;
    }
    if (tipo === 'avaliacao' && nota === 0) {
      setError('Escolha uma nota pra esse café.');
      return;
    }
    if (tipo === 'receita' && titulo.trim().length < 3) {
      setError('Dê um título pra sua receita.');
      return;
    }

    setSending(true);
    try {
      const base = { texto: texto.trim(), temFoto, publicarNoFeed: isFeed };
      if (tipo === 'avaliacao') {
        await postApi.create({ tipo: 'avaliacao', produtoId, nota, ...base });
      } else {
        await postApi.create({ tipo: 'receita', titulo: titulo.trim(), ...base });
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível publicar.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isFeed ? 'Novo post no feed' : 'Novo registro no diário'}</Text>

      <View style={styles.tabs}>
        <Pressable style={[styles.tabBtn, tipo === 'avaliacao' && styles.tabBtnActive]} onPress={() => setTipo('avaliacao')}>
          <Text style={[styles.tabText, tipo === 'avaliacao' && styles.tabTextActive]}>Avaliação</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tipo === 'receita' && styles.tabBtnActive]} onPress={() => setTipo('receita')}>
          <Text style={[styles.tabText, tipo === 'receita' && styles.tabTextActive]}>Receita</Text>
        </Pressable>
      </View>

      {tipo === 'avaliacao' ? (
        <>
          <Text style={styles.fieldLabel}>Café</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={produtoId} onValueChange={setProdutoId}>
              {products.map((p) => (
                <Picker.Item key={p.id} label={p.nome} value={p.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>Sua nota</Text>
          <StarRating value={nota} onChange={setNota} size={28} />
        </>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Título da receita</Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Gelado com Cerrado Suave"
          />
        </>
      )}

      <Text style={styles.fieldLabel}>{tipo === 'avaliacao' ? 'O que você achou?' : 'Modo de preparo'}</Text>
      <TextInput
        style={styles.textarea}
        value={texto}
        onChangeText={setTexto}
        multiline
        placeholder={tipo === 'avaliacao' ? 'Conte como foi essa xícara...' : 'Compartilhe sua receita, passo a passo...'}
      />

      <Pressable style={[styles.photoBtn, temFoto && styles.photoBtnActive]} onPress={() => setTemFoto((v) => !v)}>
        <Text style={[styles.photoBtnText, temFoto && styles.photoBtnTextActive]}>
          {temFoto ? 'Foto adicionada ✓' : 'Adicionar foto'}
        </Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        label={isFeed ? 'Publicar no feed' : 'Salvar no diário'}
        onPress={handleSubmit}
        loading={sending}
        fullWidth
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: 50 },
  title: { ...typography.h2, color: colors.cafe, marginBottom: spacing.md, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#F1E6D6', borderRadius: radius.pill, padding: 4, marginBottom: spacing.lg },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.cafe },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.cafe },
  tabTextActive: { color: '#fff' },
  fieldLabel: { ...typography.label, color: colors.cafe, marginTop: spacing.sm, marginBottom: 6 },
  pickerWrap: { borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#fff', marginBottom: spacing.sm },
  input: {
    borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#fff',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.cafe
  },
  textarea: {
    borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#fff',
    padding: spacing.md, minHeight: 100, textAlignVertical: 'top',
    fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.cafe
  },
  photoBtn: {
    borderWidth: 1.6, borderColor: '#DCC9A8', borderStyle: 'dashed', borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg, backgroundColor: '#FBF6EF'
  },
  photoBtnActive: { borderColor: colors.verde, borderStyle: 'solid' },
  photoBtnText: { color: colors.cinza, fontFamily: fonts.bodyBold, fontSize: 12.5 },
  photoBtnTextActive: { color: colors.verde },
  errorText: { color: colors.vermelho, ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.md }
});
