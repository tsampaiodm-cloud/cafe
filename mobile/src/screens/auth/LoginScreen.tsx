import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { useAuth } from '../../state/AuthContext';
import { ApiError } from '../../lib/api';

const logo = require('../../../assets/icon.png');

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // navegação pro app principal acontece sozinha: o RootNavigator
      // observa o estado de `user` no AuthContext e troca de stack.
    } catch (err) {
      if (err instanceof ApiError) {
        // O backend já manda a mensagem certa tanto pra 401
        // (credenciais inválidas) quanto pra 429 (rate limit
        // estourado, com o tempo de espera formatado).
        setError(err.message);
      } else {
        setError('Não foi possível entrar. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image source={logo} style={styles.logo} />
      <Text style={styles.title}>Bem-vinda de volta</Text>
      <Text style={styles.subtitle}>Entre pra continuar no seu cantinho cafeeiro.</Text>

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
          placeholder="••••••••"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Entrar" onPress={handleLogin} loading={loading} fullWidth />

      <Text style={styles.footerText} onPress={() => navigation.navigate('Register')}>
        Ainda não tem conta? <Text style={styles.footerLink}>Cadastre-se</Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.xl, justifyContent: 'center' },
  logo: { width: 64, height: 64, borderRadius: 32, alignSelf: 'center', marginBottom: spacing.lg },
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
