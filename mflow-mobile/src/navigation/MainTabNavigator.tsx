import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { POSScreen } from '../screens/pos/POSScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ProductsScreen } from '../screens/products/ProductsScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
import { SalesHistoryScreen } from '../screens/sales/SalesHistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MobileTopHeader } from '../components/MobileTopHeader';
import { ShoppingBag, LayoutDashboard, Package, TrendingDown, Receipt, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="POSRegister"
      screenOptions={{
        header: () => <MobileTopHeader />,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#818CF8',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      {/* 1st Tab: POS Register (Selling is the primary app purpose) */}
      <Tab.Screen
        name="POSRegister"
        component={POSScreen}
        options={{
          title: 'Register',
          headerTitle: 'POS Register',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />

      {/* 2nd Tab: Dashboard Metrics */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Home',
          headerTitle: 'MFlow Mobile Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />

      {/* 3rd Tab: Products & Inventory */}
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Inventory',
          headerTitle: 'Products & Stock',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />

      {/* 4th Tab: Business Expenses */}
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          title: 'Expenses',
          headerTitle: 'Business Outflows',
          tabBarIcon: ({ color, size }) => <TrendingDown color={color} size={size} />,
        }}
      />

      {/* 5th Tab: Sales History */}
      <Tab.Screen
        name="SalesHistory"
        component={SalesHistoryScreen}
        options={{
          title: 'Sales Log',
          headerTitle: 'Sales & Receipts',
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
        }}
      />

      {/* 6th Tab: Account & Branch */}
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
