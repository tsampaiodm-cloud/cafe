import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { useAuth } from '../../state/AuthContext';
import { ApiError } from '../../lib/api';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setLoading(true);
    try {
      await register(nome.trim(), email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        // Em erro de validação (400), o backend manda os detalhes por
        // campo em err.details — aqui simplificamos numa mensagem só,
        // mas dá pra mapear campo a campo se quiser destacar no formulário.
        setError(err.message);
      } else {
        setError('Não foi possível criar sua conta. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Leva menos de um minuto.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nome completo</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="voce@email.com"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mín. 8 caracteres, com maiúscula, minúscula e número"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Criar conta" onPress={handleRegister} loading={loading} fullWidth />

      <Text style={styles.footerText} onPress={() => navigation.navigate('Login')}>
        Já tem conta? <Text style={styles.footerLink}>Entrar</Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.xl, justifyContent: 'center' },
  title: { ...typography.h1, color: colors.cafe, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.cinza, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  field: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.cafe, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.4,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.cafe,
    backgroundColor: '#fff'
  },
  error: { color: colors.vermelho, ...typography.bodySmall, marginBottom: spacing.md, textAlign: 'center' },
  footerText: { ...typography.bodySmall, color: colors.cinza, textAlign: 'center', marginTop: spacing.lg },
  footerLink: { color: colors.dourado, fontFamily: fonts.bodyBold }
});
