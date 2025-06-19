import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProfileScreen from '../screens/ProfileScreen';
import GalleryScreen from '../screens/GalleryScreen';
import UserManagementScreen from '../screens/UserManagementScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs({ route }) {
  const { isAdmin } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Uploads') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: 'My Profile' }}
      />
      <Tab.Screen
        name="Uploads"
        component={GalleryScreen}
        options={{ headerTitle: 'Upload Management' }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Users"
          component={UserManagementScreen}
          options={{ headerTitle: 'User Management' }}
        />
      )}
    </Tab.Navigator>
  );
}
