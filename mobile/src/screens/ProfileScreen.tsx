import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Button } from '../components/Button';
import { useAuth } from '../state/AuthContext';
import { api, ApiError } from '../lib/api';

export default function ProfileScreen() {
  const { user, profile, refreshProfile, logout } = useAuth();

  const [form, setForm] = useState({
    nome: '', telefone: '', cpf: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        nome: profile.nome ?? '',
        telefone: profile.telefone ?? '',
        cpf: profile.cpf ?? '',
        cep: profile.cep ?? '',
        rua: profile.rua ?? '',
        numero: profile.numero ?? '',
        complemento: profile.complemento ?? '',
        bairro: profile.bairro ?? '',
        cidade: profile.cidade ?? '',
        uf: profile.uf ?? ''
      });
    }
  }, [profile]);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      // O backend valida tudo de novo (CPF com dígito verificador,
      // CEP/telefone só dígitos, UF numa lista fechada) — o formulário
      // aqui não precisa duplicar essa lógica, só exibir o erro que
      // vier em err.details se a validação falhar.
      await api.patch('/api/profile', form);
      await refreshProfile();
      setMessage('Perfil atualizado.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Editar perfil</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <Field label="Nome completo" value={form.nome} onChangeText={(v) => setField('nome', v)} />
      <Field label="Telefone" value={form.telefone} onChangeText={(v) => setField('telefone', v)} keyboardType="phone-pad" />
      <Field label="CPF (para nota fiscal)" value={form.cpf} onChangeText={(v) => setField('cpf', v)} keyboardType="numeric" />
      <Field label="CEP" value={form.cep} onChangeText={(v) => setField('cep', v)} keyboardType="numeric" />
      <Field label="Rua" value={form.rua} onChangeText={(v) => setField('rua', v)} />
      <Field label="Número" value={form.numero} onChangeText={(v) => setField('numero', v)} />
      <Field label="Complemento" value={form.complemento} onChangeText={(v) => setField('complemento', v)} />
      <Field label="Bairro" value={form.bairro} onChangeText={(v) => setField('bairro', v)} />
      <Field label="Cidade" value={form.cidade} onChangeText={(v) => setField('cidade', v)} />
      <Field label="UF" value={form.uf} onChangeText={(v) => setField('uf', v.toUpperCase())} maxLength={2} />

      {message && <Text style={styles.success}>{message}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Salvar alterações" onPress={handleSave} loading={saving} fullWidth />

      <Text style={styles.signOut} onPress={logout}>
        Sair da conta
      </Text>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType ?? 'default'}
        maxLength={props.maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingTop: 60, paddingBottom: 60 },
  title: { ...typography.h1, color: colors.cafe },
  subtitle: { ...typography.bodySmall, color: colors.cinza, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.cafe, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.4,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.cafe,
    backgroundColor: '#fff'
  },
  success: { color: colors.verde, ...typography.bodySmall, marginBottom: spacing.md, textAlign: 'center' },
  error: { color: colors.vermelho, ...typography.bodySmall, marginBottom: spacing.md, textAlign: 'center' },
  signOut: { color: colors.vermelho, fontFamily: fonts.bodyBold, textAlign: 'center', marginTop: spacing.xl }
});
