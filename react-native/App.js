import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import MainTabs from './navigation/MainTabs';

const Stack = createNativeStackNavigator();

export default function App() {
  // 🔧 You can later replace this with a state or context value
  const isAdmin = true; // ← Replace with actual logic from login or user profile

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* ✅ Pass isAdmin to MainTabs via initialParams */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          initialParams={{ isAdmin }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
