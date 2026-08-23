import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { POSScreen } from '../screens/pos/POSScreen';
import { SalesHistoryScreen } from '../screens/sales/SalesHistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ShoppingBag, Receipt, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontWeight: '800',
          fontSize: 16,
        },
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#818CF8',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="POSRegister"
        component={POSScreen}
        options={{
          title: 'Register',
          headerTitle: 'POS Register',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SalesHistory"
        component={SalesHistoryScreen}
        options={{
          title: 'Sales Log',
          headerTitle: 'Sales & Receipts',
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Account',
          headerTitle: 'Branch & Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
