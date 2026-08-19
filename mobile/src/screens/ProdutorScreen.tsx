import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from '../components/Card';
import { TopBar } from '../components/TopBar';
import { StarRating } from '../components/StarRating';
import { catalogApi, Farm } from '../lib/catalogApi';

const NOTA_OPTIONS = [
  { label: 'Todas', value: '' },
  { label: '4 ★ ou mais', value: '4' },
  { label: '4.5 ★ ou mais', value: '4.5' }
];

export default function ProdutorScreen() {
  const navigation = useNavigation<any>();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [regioes, setRegioes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [regiao, setRegiao] = useState('');
  const [notaMinima, setNotaMinima] = useState('');

  // Debounce simples pra não disparar uma chamada de API a cada tecla
  // digitada na busca — só busca 350ms depois que a pessoa parar de digitar.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await catalogApi.listFarms({
        busca: busca || undefined,
        regiao: regiao || undefined,
        notaMinima: notaMinima ? parseFloat(notaMinima) : undefined
      });
      setFarms(result.farms);
      setRegioes(result.regioesDisponiveis);
    } catch {
      setError('Não foi possível carregar as fazendas.');
    } finally {
      setLoading(false);
    }
  }, [busca, regiao, notaMinima]);

  // Recarrega (com nova ordem aleatória vinda do servidor) toda vez
  // que a tela ganha foco — reproduz o "embaralha a cada visita" do
  // protótipo, mas agora decidido no backend, não no cliente.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  function handleSearchChange(text: string) {
    setBusca(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(), 350);
  }

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Direto do produtor</Text>
        <Text style={styles.subtitle}>Conheça as fazendas parceiras por trás de cada xícara.</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por fazenda, café, região, notas..."
          value={busca}
          onChangeText={handleSearchChange}
        />

        <View style={styles.filterRow}>
          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>Região</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={regiao} onValueChange={(v) => setRegiao(v)} style={styles.picker}>
                <Picker.Item label="Todas" value="" />
                {regioes.map((r) => (
                  <Picker.Item key={r} label={r} value={r} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>Avaliação mínima</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={notaMinima} onValueChange={(v) => setNotaMinima(v)} style={styles.picker}>
                {NOTA_OPTIONS.map((o) => (
                  <Picker.Item key={o.value} label={o.label} value={o.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Picker dispara onValueChange já com o novo valor, mas ainda
            precisa recarregar — como regiao/notaMinima não passam pelo
            debounce da busca, recarregamos direto ao trocar. */}
        {(regiao || notaMinima) && (
          <Pressable onPress={load} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Aplicar filtros</Text>
          </Pressable>
        )}

        {loading && <ActivityIndicator color={colors.dourado} style={{ marginTop: spacing.xl }} />}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && farms.length === 0 && (
          <Text style={styles.emptyText}>Nenhuma fazenda encontrada com esses filtros.</Text>
        )}

        {farms.map((farm) => (
          <Pressable key={farm.id} onPress={() => navigation.navigate('FarmDetail', { id: farm.id })}>
            <Card style={styles.farmCard}>
              <View style={styles.farmThumb} />
              <Text style={styles.farmName}>{farm.nome}</Text>
              <Text style={styles.farmRegion}>{farm.regiao}</Text>
              <StarRating
                value={parseFloat(farm.avg_rating) || 0}
                size={13}
                showCount={parseInt(String(farm.review_count), 10) || 0}
              />
              <Text style={styles.farmDesc}>{farm.resumo}</Text>
              <Text style={styles.seeMore}>Ver fazenda →</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  title: { ...typography.h1, color: colors.cafe },
  subtitle: { ...typography.body, color: colors.cinza, marginTop: spacing.xs, marginBottom: spacing.md },
  searchInput: {
    borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.cafe,
    backgroundColor: '#fff', marginBottom: spacing.sm
  },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  filterField: { flex: 1 },
  filterLabel: { ...typography.label, color: colors.cafe, marginBottom: 4 },
  pickerWrap: { borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#fff', overflow: 'hidden' },
  picker: Platform.select({ web: { height: 40, paddingHorizontal: 8 }, default: {} }) as object,
  applyBtn: { alignSelf: 'flex-start', marginBottom: spacing.md },
  applyBtnText: { color: colors.dourado, fontFamily: fonts.bodyBold, fontSize: 12.5 },
  errorText: { color: colors.vermelho, ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  emptyText: { color: colors.cinza, ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  farmCard: { padding: spacing.md, marginBottom: spacing.md },
  farmThumb: { width: '100%', height: 110, borderRadius: radius.sm, backgroundColor: colors.border, marginBottom: spacing.sm },
  farmName: { ...typography.h3, color: colors.cafe },
  farmRegion: { ...typography.label, color: colors.verde, marginBottom: 6 },
  farmDesc: { ...typography.bodySmall, color: colors.textMuted, marginTop: 6, marginBottom: 8, lineHeight: 19 },
  seeMore: { color: colors.dourado, fontFamily: fonts.bodyBold, fontSize: 12.5 }
});
