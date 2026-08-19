import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * expo-secure-store usa Keychain (iOS) / Keystore (Android), mas não
 * existe no navegador. Na web caímos pra localStorage — não é tão
 * seguro quanto um cofre nativo, mas é o padrão aceitável pra SPA;
 * se quiser mais rigor na web, troque por um cookie httpOnly setado
 * pelo backend no login, em vez de guardar o token no client.
 */
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const storage = { setItem, getItem, removeItem };
