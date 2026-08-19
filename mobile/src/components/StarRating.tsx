import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  value: number; // 0-5, aceita decimal para exibição (arredonda pra estrela cheia mais próxima)
  size?: number;
  onChange?: (value: number) => void; // se informado, vira um seletor interativo
  showCount?: number;
};

export function StarRating({ value, size = 15, onChange, showCount }: Props) {
  const rounded = Math.round(value);
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((n) => {
        const filled = n <= rounded;
        const star = (
          <Ionicons
            key={n}
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? colors.dourado : colors.cinza}
          />
        );
        if (!onChange) return star;
        return (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={4}>
            {star}
          </Pressable>
        );
      })}
      {typeof showCount === 'number' && (
        <Text style={styles.count}>
          {value.toFixed(1)} ({showCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  count: { fontSize: 11, color: colors.cinza, marginLeft: 6 }
});
