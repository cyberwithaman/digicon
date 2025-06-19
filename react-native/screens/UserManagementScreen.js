import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, Image, StyleSheet,
  Alert, ActivityIndicator, FlatList, TouchableOpacity, Platform,
  ScrollView  // Add ScrollView import
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

export default function UserManagementScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [role, setRole] = useState('user');
  const [employeeId, setEmployeeId] = useState(''); // Add employee ID state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create'); // New state for tracking active tab

  const ROLE_OPTIONS = [
    { label: 'Admin', value: 'admin' },
    { label: 'Viewer', value: 'viewer' },
    { label: 'Editor', value: 'editor' },
    { label: 'User', value: 'user' },
  ];

  useEffect(() => {
    const init = async () => {
      await checkAdminStatus();
      await fetchUsers();
      setLoading(false);
    };
    init();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return navigation.navigate('Login');

      // Get the user ID from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.error('No user ID found');
        return navigation.navigate('Login');
      }

      // Use the user ID endpoint instead of /users/me/
      const res = await fetch(`${API_URL}/users/${userId}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      const userData = await res.json();
      if (userData.role !== 'admin') {
        Alert.alert('Access Denied', 'Only administrators can access this screen');
        navigation.goBack();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to verify admin status');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      console.log('Fetching users from:', `${API_URL}/users/`);
      const res = await fetch(`${API_URL}/users/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    }
  };

  const getMimeType = (uri) => {
    const ext = uri.split('.').pop().toLowerCase();
    return ext === 'png' ? 'image/png' : 'image/jpeg';
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhoto(result.assets[0]);
    }
  };

  const resetForm = () => {
    setSelectedUserId(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setPhoto(null);
    setRole('user');
    setEmployeeId(''); // Reset employee ID
  };

  const handleSubmit = async () => {
    const isUpdating = !!selectedUserId;
    const endpoint = isUpdating
      ? `${API_URL}/users/${selectedUserId}/`
      : `${API_URL}/users/`;
    const method = isUpdating ? 'PUT' : 'POST';

    // Modified validation to only require password for new users
    if (!username || !fullName || !email || (!isUpdating && !password)) {
      const missingFields = [];
      if (!username) missingFields.push('Username');
      if (!fullName) missingFields.push('Full Name');
      if (!email) missingFields.push('Email');
      if (!isUpdating && !password) missingFields.push('Password');

      Alert.alert('Missing Fields', `Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('full_name', fullName);
    formData.append('email', email);
    formData.append('role', role);
    // Only append password if it's provided (for new users)
    if (password) formData.append('password', password);
    if (phone) formData.append('phone_number', phone);

    if (photo) {
      const uri = Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri;
      const fileName = photo.fileName || uri.split('/').pop();
      const mimeType = getMimeType(uri);

      formData.append('profile_photo', {
        uri: photo.uri,
        name: fileName,
        type: mimeType,
      });
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', `User ${isUpdating ? 'updated' : 'created'} successfully!`);
        resetForm();
        fetchUsers();
      } else {
        const errorMessages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        Alert.alert('Error', `Failed to ${isUpdating ? 'update' : 'create'} user:\n${errorMessages}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', `Something went wrong`);
    }
  };

  const selectUserForEdit = (user) => {
    setSelectedUserId(user.id);
    setUsername(user.username);
    setFullName(user.full_name);
    setEmail(user.email);
    setPhone(user.phone_number || '');
    setRole(user.role);
    setPhoto(user.profile_photo ? { uri: user.profile_photo } : null);
    setPassword('');
    setEmployeeId(user.employee_id || ''); // Set employee ID when editing
  };

  const handleResetPassword = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      // Show confirmation dialog
      Alert.alert(
        'Reset Password',
        'Are you sure you want to reset this user\'s password?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reset',
            onPress: async () => {
              const res = await fetch(`${API_URL}/users/${userId}/reset-password/`, {
                method: 'POST',
                headers: {
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  new_password: 'TempPassword123!', // Default temporary password
                  confirm_password: 'TempPassword123!'
                })
              });

              const data = await res.json();

              if (res.ok) {
                Alert.alert(
                  'Password Reset Successful',
                  `New temporary password: TempPassword123!\n\nPlease instruct the user to change their password immediately.`,
                  [
                    { text: 'OK', onPress: () => { } }
                  ]
                );
              } else {
                Alert.alert('Error', data.message || 'Failed to reset password');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      Alert.alert(
        'Delete User',
        'Are you sure you want to delete this user? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: async () => {
              const res = await fetch(`${API_URL}/users/${userId}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Token ${token}`,
                },
              });

              if (res.ok) {
                Alert.alert('Success', 'User deleted successfully!');
                fetchUsers();
                resetForm();
              } else {
                const data = await res.json();
                Alert.alert('Error', data.message || 'Failed to delete user');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete user error:', error);
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <MaterialIcons 
            name="person-add" 
            size={20} 
            color={activeTab === 'create' ? 'white' : '#555'}
          />
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>Create User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <MaterialIcons 
            name="list-alt" 
            size={20} 
            color={activeTab === 'list' ? 'white' : '#555'}
          />
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>List All Users</Text>
        </TouchableOpacity>
      </View>

      {/* Create User Form */}
      {activeTab === 'create' && (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.formSection}>
            <Text style={styles.title}>
              {selectedUserId ? 'Update User' : 'Create New User'}
            </Text>

            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput placeholder="Username *" value={username} onChangeText={setUsername} style={styles.input} />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="badge" size={20} color="#666" style={styles.inputIcon} />
              <TextInput placeholder="Full Name *" value={fullName} onChangeText={setFullName} style={styles.input} />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput placeholder="Email *" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
              <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
            </View>

            {/* Display Employee ID (read-only) */}
            {selectedUserId && employeeId && (
              <View style={styles.employeeIdContainer}>
                <Text style={styles.employeeIdLabel}>Employee ID:</Text>
                <Text style={styles.employeeIdValue}>{employeeId}</Text>
              </View>
            )}

            {/* Show password field only for new users */}
            {!selectedUserId && (
              <TextInput
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
            )}

            {/* Add Reset Password button for existing users */}
            {selectedUserId && (
              <View style={styles.resetPasswordContainer}>
                <Button
                  title="Reset User Password"
                  onPress={() => handleResetPassword(selectedUserId)}
                  color="#ff9800"
                />
              </View>
            )}

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Role:</Text>
              <View style={styles.roleButtons}>
                {ROLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.roleButton,
                      role === option.value && styles.roleButtonActive
                    ]}
                    onPress={() => setRole(option.value)}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      role === option.value && styles.roleButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Pick Profile Photo" onPress={pickImage} />
            {photo && <Image source={{ uri: photo.uri }} style={styles.profilePhoto} />}

            <View style={styles.buttonContainer}>
              <Button title={selectedUserId ? "Update User" : "Create User"} onPress={handleSubmit} />
              {selectedUserId && <Button title="Cancel Edit" onPress={resetForm} color="red" />}
            </View>
          </View>
        </ScrollView>
      )}

      {/* List All Users */}
      {activeTab === 'list' && (
        <View style={styles.listSection}>
          <Text style={styles.title}>All Users</Text>
          <FlatList
            style={styles.userList}
            showsVerticalScrollIndicator={true}
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                selectUserForEdit(item);
                setActiveTab('create');
              }} style={styles.userItem}>
                <View style={styles.userItemRow}>
                  {item.profile_photo ? (
                    <Image source={{ uri: item.profile_photo }} style={styles.userThumbnail} />
                  ) : (
                    <View style={styles.userThumbnailPlaceholder}>
                      <MaterialIcons name="person" size={24} color="white" />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.full_name}</Text>
                    <Text style={styles.userInfo}>@{item.username} • {item.role}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    {item.employee_id && (
                      <Text style={styles.employeeId}>ID: {item.employee_id}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item.id)}
                  >
                    <MaterialIcons name="delete" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10, flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontWeight: '600',
    color: '#555',
  },
  activeTabText: {
    color: 'white',
  },

  // Form section
  formSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // List section
  listSection: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Employee ID styles
  employeeIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
  },
  employeeIdLabel: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  employeeIdValue: {
    color: '#007AFF',
    fontWeight: '500',
  },
  employeeId: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },

  // Existing styles
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#999', padding: 10, marginBottom: 15, borderRadius: 5 },
  roleContainer: { marginBottom: 15 },
  roleLabel: { fontSize: 16, marginBottom: 8 },
  roleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'white',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    color: '#007AFF',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  profilePhoto: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginTop: 10, marginBottom: 15 },
  buttonContainer: { marginTop: 10, gap: 10 },

  // Enhanced user item styles
  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'white',
  },
  userItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userThumbnailPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userThumbnailText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  resetPasswordContainer: {
    marginBottom: 15,
  },
  scrollContainer: {
    flex: 1,
  },

  userList: {
    flex: 1,
    marginTop: 10,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ff4444',
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});