import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, DESKTOP_BREAKPOINT } from '../theme/spacing';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Loja: 'storefront-outline',
  Assinatura: 'repeat-outline',
  Produtor: 'location-outline',
  Scanner: 'scan-outline',
  Feed: 'grid-outline',
  Diario: 'book-outline',
  Trilhas: 'trail-sign-outline'
};

const LABELS: Record<string, string> = {
  Loja: 'Loja',
  Assinatura: 'Assinatura',
  Produtor: 'Direto do produtor',
  Scanner: 'Escanear',
  Feed: 'Feed',
  Diario: 'Diário',
  Trilhas: 'Trilhas'
};

/**
 * No protótipo HTML esse era o menu fixo inferior com 7 itens
 * (incluindo o botão de escanear em destaque no meio). Aqui mantemos
 * a mesma ideia no mobile, mas em telas largas (web/desktop) o padrão
 * de menu inferior fixo não faz sentido — trocamos pra uma barra fina
 * no topo, ainda com os mesmos itens e a mesma navegação por baixo.
 */
export function ResponsiveTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <View style={[styles.bar, isDesktop ? styles.barTop : styles.barBottom]}>
      {state.routes
        .filter((route) => route.name !== 'Home') // Home é acessada pela logo na TopBar, não pela tab bar
        .map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const isScanner = route.name === 'Scanner';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.item, isDesktop && styles.itemDesktop]}
            >
              <View style={[isScanner && styles.scannerCircle]}>
                <Ionicons
                  name={ICONS[route.name]}
                  size={isScanner ? 18 : 17}
                  color={isScanner ? '#fff' : isFocused ? colors.dourado : colors.cinza}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? colors.cafe : colors.cinza },
                  isDesktop && styles.labelDesktop
                ]}
                numberOfLines={1}
              >
                {LABELS[route.name]}
              </Text>
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: '#fff', borderColor: colors.border },
  barBottom: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: 2
  },
  barTop: {
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    gap: spacing.xl
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  itemDesktop: { flex: 0, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm },
  scannerCircle: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.dourado,
    alignItems: 'center', justifyContent: 'center', marginTop: -18, borderWidth: 3, borderColor: '#fff'
  },
  label: { fontSize: 8.5, fontWeight: '700', textAlign: 'center' },
  labelDesktop: { fontSize: 12.5 }
});
