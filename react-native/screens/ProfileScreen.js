import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { API_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
// Import icons from Expo vector icons
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Feather
} from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/users/${userId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      await AsyncStorage.clear();
      Alert.alert('Logged out');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      await AsyncStorage.clear();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const handleEdit = () => {
    setEditedUser({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number || '',
    });
    setEditModalVisible(true);
  };

  const handlePasswordReset = () => {
    setPasswords({
      newPassword: '',
      confirmPassword: '',
    });
    setResetPasswordModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/users/${user.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(editedUser),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      await fetchProfile();
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!passwords.newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/users/password/change/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          new_password: passwords.newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }

      setResetPasswordModalVisible(false);
      setPasswords({ newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const formatProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;

    // If already a full URL, return it
    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    // Ensure we have a clean path without double slashes
    const baseUrl = API_URL.replace(/\/+$/, ''); // Remove trailing slashes
    const cleanPath = photoPath.replace(/^\/+/, ''); // Remove leading slashes

    // Construct the full URL
    return `${baseUrl}/${cleanPath}`;
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const formData = new FormData();
        formData.append('profile_photo', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile_photo.jpg',
        });

        const token = await AsyncStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/users/${user.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to update profile photo');
        await fetchProfile(); // Refresh profile data
        Alert.alert('Success', 'Profile photo updated successfully');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile photo');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1565C0" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileContainer}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri: formatProfilePhotoUrl(user?.profile_photo) || 'https://via.placeholder.com/100',
                }}
                style={styles.profileImage}
              />
              <View style={styles.cameraIconContainer}>
                <Feather name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>{user?.full_name || 'Loading...'}</Text>
            <View style={styles.usernameContainer}>
              <FontAwesome5 name="user-tag" size={14} color="#666" style={{ marginRight: 5 }} />
              <Text style={styles.userUsername}>@{user?.username || 'Loading...'}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="person" size={22} color="#2196F3" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.labelContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.itemIcon} />
                <Text style={styles.label}>Full Name</Text>
              </View>
              <Text style={styles.value}>{user?.full_name || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.labelContainer}>
                <FontAwesome5 name="user-alt" size={18} color="#666" style={styles.itemIcon} />
                <Text style={styles.label}>Username</Text>
              </View>
              <Text style={styles.value}>{user?.username || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.labelContainer}>
                <MaterialIcons name="email" size={20} color="#666" style={styles.itemIcon} />
                <Text style={styles.label}>Email</Text>
              </View>
              <Text style={styles.value}>{user?.email || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.labelContainer}>
                <FontAwesome5 name="phone-alt" size={18} color="#666" style={styles.itemIcon} />
                <Text style={styles.label}>Phone</Text>
              </View>
              <Text style={styles.value}>{user?.phone_number || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="id-card" size={20} color="#666" style={styles.itemIcon} />
                <Text style={styles.label}>Employee ID</Text>
              </View>
              <Text style={styles.value}>{user?.employee_id || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.iconButton, styles.editButton]}
              onPress={handleEdit}
              disabled={!user}
            >
              <Feather name="edit-2" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.resetButton]}
              onPress={handlePasswordReset}
              disabled={!user}
            >
              <MaterialCommunityIcons name="lock-reset" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Feather name="edit-2" size={24} color="#2196F3" />
              <Text style={styles.modalTitle}>Edit Profile</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={editedUser.full_name}
                onChangeText={(text) => setEditedUser({ ...editedUser, full_name: text })}
                placeholder="Full Name"
              />
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome5 name="user-alt" size={18} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={editedUser.username}
                onChangeText={(text) => setEditedUser({ ...editedUser, username: text })}
                placeholder="Username"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={editedUser.email}
                onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
                placeholder="Email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome5 name="phone-alt" size={18} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={editedUser.phone_number}
                onChangeText={(text) => setEditedUser({ ...editedUser, phone_number: text })}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <MaterialIcons name="cancel" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <MaterialIcons name="save" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={resetPasswordModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <MaterialCommunityIcons name="lock-reset" size={24} color="#FF9800" />
              <Text style={styles.modalTitle}>Reset Password</Text>
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={passwords.newPassword}
                onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
                placeholder="New Password"
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={passwords.confirmPassword}
                onChangeText={(text) => setPasswords({ ...passwords, confirmPassword: text })}
                placeholder="Confirm New Password"
                secureTextEntry
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setResetPasswordModalVisible(false);
                  setPasswords({ newPassword: '', confirmPassword: '' });
                }}
              >
                <MaterialIcons name="cancel" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleResetPassword}
              >
                <MaterialIcons name="check-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutIconContainer: {
    padding: 5,
  },
  profileContainer: {
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userUsername: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  buttonSection: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  logoutButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    padding: 12,
    paddingRight: 0,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
});