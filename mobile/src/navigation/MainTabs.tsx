import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { ResponsiveTabBar } from './ResponsiveTabBar';

import HomeScreen from '../screens/HomeScreen';
import LojaScreen from '../screens/LojaScreen';
import AssinaturaScreen from '../screens/AssinaturaScreen';
import ProdutorScreen from '../screens/ProdutorScreen';
import ScannerScreen from '../screens/ScannerScreen';
import FeedScreen from '../screens/FeedScreen';
import DiarioScreen from '../screens/DiarioScreen';
import TrilhasScreen from '../screens/TrilhasScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ResponsiveTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Loja" component={LojaScreen} />
      <Tab.Screen name="Assinatura" component={AssinaturaScreen} />
      <Tab.Screen name="Produtor" component={ProdutorScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Diario" component={DiarioScreen} />
      <Tab.Screen name="Trilhas" component={TrilhasScreen} />
    </Tab.Navigator>
  );
}
