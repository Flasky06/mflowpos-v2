import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/store/authStore';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
