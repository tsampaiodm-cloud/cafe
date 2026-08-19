import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Button } from '../components/Button';
import { catalogApi } from '../lib/catalogApi';
import { ApiError } from '../lib/api';

export default function ScannerScreen() {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function lookup(code: string) {
    setLooking(true);
    setNotFound(false);
    try {
      const { product } = await catalogApi.getProductByBarcode(code);
      navigation.navigate('ProductDetail', { id: product.id });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setNotFound(true); // falha de rede também cai aqui, com a mesma mensagem simples
      }
    } finally {
      setLooking(false);
    }
  }

  function handleScan(result: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);
    setLastCode(result.data);
    lookup(result.data);
  }

  function scanAgain() {
    setScanned(false);
    setLastCode(null);
    setNotFound(false);
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Escanear código</Text>
        <Text style={styles.info}>
          A leitura de código de barras pela câmera do navegador depende do suporte de cada
          browser/dispositivo e costuma ser menos confiável que no app nativo. Digite o código
          manualmente, ou use o app iOS/Android pra escanear de verdade.
        </Text>
        <TextInput
          style={styles.manualInput}
          placeholder="Código de barras (EAN-13)"
          value={manualCode}
          onChangeText={setManualCode}
          keyboardType="number-pad"
        />
        <Button label="Buscar" onPress={() => lookup(manualCode.trim())} loading={looking} />
        {notFound && <Text style={styles.notFound}>Nenhum produto encontrado para esse código.</Text>}
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.center} />; // permissões ainda carregando
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Precisamos da câmera</Text>
        <Text style={styles.info}>Para escanear o código de barras do pacote de café.</Text>
        <Button label="Permitir acesso à câmera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      <View style={styles.overlay}>
        <View style={styles.viewfinder} />
      </View>

      {scanned && (
        <View style={styles.resultBar}>
          {looking ? (
            <ActivityIndicator color="#fff" />
          ) : notFound ? (
            <Text style={styles.resultText}>Nenhum produto encontrado para o código {lastCode}.</Text>
          ) : (
            <Text style={styles.resultText}>Código lido: {lastCode}</Text>
          )}
          <Button label="Escanear de novo" variant="secondary" onPress={scanAgain} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { ...typography.h1, color: colors.cafe, textAlign: 'center' },
  info: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  manualInput: {
    borderWidth: 1.4, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#fff',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, width: '100%',
    fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.cafe, marginBottom: spacing.sm
  },
  notFound: { color: colors.vermelho, ...typography.bodySmall },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewfinder: { width: 260, height: 160, borderWidth: 3, borderColor: colors.dourado, borderRadius: 16 },
  resultBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', padding: spacing.lg, gap: spacing.md, alignItems: 'center'
  },
  resultText: { color: '#fff', ...typography.body, textAlign: 'center' }
});
