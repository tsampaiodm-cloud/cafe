import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { AuthNavigator } from './AuthNavigator';
import { useAuth } from '../state/AuthContext';
import { colors } from '../theme/colors';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FarmDetailScreen from '../screens/FarmDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import TrilhaDetailScreen from '../screens/TrilhaDetailScreen';
import NewPostScreen from '../screens/NewPostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.dourado} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
          <Stack.Screen name="Main" component={MainTabs} options={{ presentation: 'card' }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'Carrinho' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Perfil' }} />
          <Stack.Screen
            name="FarmDetail"
            component={FarmDetailScreen}
            options={{ headerShown: true, title: 'Fazenda', presentation: 'card' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ headerShown: true, title: 'Café', presentation: 'card' }}
          />
          <Stack.Screen
            name="TrilhaDetail"
            component={TrilhaDetailScreen}
            options={{ headerShown: true, title: 'Trilha', presentation: 'card' }}
          />
          <Stack.Screen
            name="NewPost"
            component={NewPostScreen}
            options={{ headerShown: true, title: 'Novo post', presentation: 'modal' }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ headerShown: true, title: 'Post', presentation: 'card' }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
