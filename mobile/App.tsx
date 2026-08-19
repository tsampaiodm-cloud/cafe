import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts as usePlayfairFonts,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold
} from '@expo-google-fonts/playfair-display';
import { useFonts as useLatoFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { useFonts as useScriptFonts, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';

import { AuthProvider } from './src/state/AuthContext';
import { CartProvider } from './src/state/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  const [playfairLoaded] = usePlayfairFonts({ PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });
  const [latoLoaded] = useLatoFonts({ Lato_400Regular, Lato_700Bold });
  const [scriptLoaded] = useScriptFonts({ GreatVibes_400Regular });

  const fontsReady = playfairLoaded && latoLoaded && scriptLoaded;

  if (!fontsReady) {
    // Evita mostrar texto com a fonte do sistema por um instante antes
    // de trocar pra Playfair/Lato — melhor uma tela em branco rápida.
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </CartProvider>
    </AuthProvider>
  );
}
