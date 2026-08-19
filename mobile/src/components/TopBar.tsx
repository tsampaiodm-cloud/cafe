import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useCart } from '../state/CartContext';
import { useAuth } from '../state/AuthContext';

const logo = require('../../assets/icon.png');

export function TopBar() {
  const navigation = useNavigation<any>();
  const { count } = useCart();
  const { profile, user } = useAuth();

  const initial = (profile?.nome || user?.email || 'M').trim().charAt(0).toUpperCase();

  return (
    <View style={styles.row} pointerEvents="box-none">
      <Pressable
        onPress={() => navigation.navigate('Home')}
        style={styles.iconBtn}
        accessibilityLabel="Início"
      >
        <Image source={logo} style={styles.logoImg} />
      </Pressable>

      <View style={styles.rightGroup}>
        <Pressable onPress={() => navigation.navigate('Cart')} style={styles.iconBtn} accessibilityLabel="Carrinho">
          <Text style={styles.cartGlyph}>🛒</Text>
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={[styles.iconBtn, styles.avatar]}
          accessibilityLabel="Meu perfil"
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20
  },
  rightGroup: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cafe,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  logoImg: { width: 24, height: 24, borderRadius: 12 },
  cartGlyph: { fontSize: 17 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.cream
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  avatar: { backgroundColor: colors.dourado, borderColor: colors.dourado },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});
