import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  Switch,
  Linking,
  Easing,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestore, EmailAuthProvider } from '../services/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where,
  getDocs 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const SettingsPage = ({ navigation }) => {
  // UI states
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const searchAnim = useState(new Animated.Value(0))[0];
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  
  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [moodTracking, setMoodTracking] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');
  const [fontSize, setFontSize] = useState('Medium');
  const [dataCollection, setDataCollection] = useState(true);
  
  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
    loadUserProfile();
  }, []);

  const loadUserSettings = async () => {
    try {
      // Load notification settings
      const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notifEnabled !== null) {
        setNotificationsEnabled(notifEnabled === 'true');
      }
      
      const reminderNotifs = await AsyncStorage.getItem('reminderNotifications');
      if (reminderNotifs !== null) {
        setReminderNotifications(reminderNotifs === 'true');
      }
      
      const chatNotifs = await AsyncStorage.getItem('chatNotifications');
      if (chatNotifs !== null) {
        setChatNotifications(chatNotifs === 'true');
      }
      
      // Load appearance settings
      const darkModeEnabled = await AsyncStorage.getItem('darkMode');
      if (darkModeEnabled !== null) {
        setDarkMode(darkModeEnabled === 'true');
      }
      
      const userLanguage = await AsyncStorage.getItem('language');
      if (userLanguage) {
        setLanguage(userLanguage);
      }
      
      const userFontSize = await AsyncStorage.getItem('fontSize');
      if (userFontSize) {
        setFontSize(userFontSize);
      }
      
      // Load privacy settings
      const dataCollectionEnabled = await AsyncStorage.getItem('dataCollection');
      if (dataCollectionEnabled !== null) {
        setDataCollection(dataCollectionEnabled === 'true');
      }
      
      const moodTrackingEnabled = await AsyncStorage.getItem('moodTracking');
      if (moodTrackingEnabled !== null) {
        setMoodTracking(moodTrackingEnabled === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            name: userData.displayName || user.displayName || '',
            email: user.email || '',
            phone: userData.phoneNumber || user.phoneNumber || '',
          });
        } else {
          // If no specific user document, at least get data from auth
          setUserProfile({
            name: user.displayName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Update Firestore document
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          displayName: userProfile.name,
          phoneNumber: userProfile.phone,
          // Don't update email in Firestore as it's managed by Firebase Auth
        }, { merge: true });

        // Update profile in Firebase Auth
        await user.updateProfile({
          displayName: userProfile.name,
        });

        if (user.email !== userProfile.email) {
          // Email update requires reauthentication in a real app
          // This is a simplified version
          Alert.alert(
            'Email Update',
            'Changing your email requires verification. Would you like to proceed?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Update', 
                onPress: () => Alert.alert(
                  'Authentication Required',
                  'For security reasons, please login again before changing your email.',
                  [{ text: 'OK' }]
                )
              }
            ]
          );
        }

        Alert.alert('Success', 'Profile updated successfully');
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordError('');
      
      // Basic validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('All fields are required');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not logged in');
      }

      // Create credential with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );

      // Reauthenticate user
      await user.reauthenticateWithCredential(credential);
      
      // Change password
      await user.updatePassword(passwordData.newPassword);
      
      // Clear password data
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      Alert.alert('Success', 'Password updated successfully');
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('Password is too weak');
      } else {
        setPasswordError(error.message || 'Failed to update password');
      }
    }
  };

  const saveSettings = async (setting, value) => {
    try {
      await AsyncStorage.setItem(setting, value.toString());
      // Show brief confirmation
      Alert.alert('Settings Updated', 'Your settings have been saved.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    
    if (value) {
      // Request notification permissions if needed
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications for MindfulSpace in your device settings.',
            [{ text: 'OK' }]
          );
          setNotificationsEnabled(false);
          return;
        }
      }
    }
    
    await saveSettings('notificationsEnabled', value);
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://mw-var3.vercel.app/');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://mw-var3.vercel.app/');
  };

  const toggleSearch = () => {
    const toValue = searchVisible ? 0 : 1;
    setSearchVisible(!searchVisible);
    Animated.timing(searchAnim, {
      toValue,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            onPress: async () => {
              await auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
      console.error('Logout error:', error);
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                await user.delete();
                Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert(
                'Authentication Required',
                'For security reasons, please login again before deleting your account.',
                [
                  {
                    text: 'OK',
                    onPress: handleLogout,
                  },
                ]
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@mindfulspace.com?subject=Support%20Request');
  };

  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi'];
  const themes = ['Dark Mode', 'Light Mode'];
  const fontSizes = ['Small', 'Medium', 'Large', 'Extra Large'];

  const downloadUserData = async () => {
    try {
      Alert.alert(
        'Download Data',
        'This will download all your personal data. Do you want to continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Download',
            onPress: async () => {
              // Show a loading indicator
              Alert.alert('Processing', 'Preparing your data for download...');
              
              const user = auth.currentUser;
              if (!user) {
                throw new Error('User not logged in');
              }
              
              // Get user profile data
              const userData = {
                profile: {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  phoneNumber: user.phoneNumber,
                  createdAt: user.metadata.creationTime,
                },
                conversations: [],
                moodEntries: [],
                settings: {},
              };
              
              // Get user document data
              const userDocRef = doc(firestore, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                userData.profile = {
                  ...userData.profile,
                  ...userDoc.data(),
                };
              }
              
              // Get conversations
              const conversationsRef = collection(firestore, 'conversations');
              const conversationsQuery = query(conversationsRef, where('userId', '==', user.uid));
              const conversationsSnapshot = await getDocs(conversationsQuery);
                
              conversationsSnapshot.forEach(doc => {
                userData.conversations.push({
                  id: doc.id,
                  ...doc.data()
                });
              });
              
              // Get mood entries
              const moodEntriesRef = collection(firestore, 'moodEntries');
              const moodEntriesQuery = query(moodEntriesRef, where('userId', '==', user.uid));
              const moodEntriesSnapshot = await getDocs(moodEntriesQuery);
                
              moodEntriesSnapshot.forEach(doc => {
                userData.moodEntries.push({
                  id: doc.id,
                  ...doc.data()
                });
              });
              
              // Get settings from AsyncStorage
              const settingsKeys = [
                'notificationsEnabled',
                'reminderNotifications',
                'chatNotifications',
                'darkMode',
                'language',
                'fontSize',
                'dataCollection',
                'moodTracking'
              ];
              
              for (const key of settingsKeys) {
                const value = await AsyncStorage.getItem(key);
                if (value !== null) {
                  userData.settings[key] = value;
                }
              }
              
              // Convert to JSON
              const jsonData = JSON.stringify(userData, null, 2);
              
              // Create a file
              const fileUri = `${FileSystem.documentDirectory}mindfulspace_data_${new Date().toISOString().slice(0, 10)}.json`;
              await FileSystem.writeAsStringAsync(fileUri, jsonData);
              
              // Share the file
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
                Alert.alert('Success', 'Your data has been downloaded');
              } else {
                Alert.alert('Error', 'Sharing is not available on this device');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error downloading data:', error);
      Alert.alert('Error', 'Failed to download your data: ' + error.message);
    }
  };

  return (
    <LinearGradient colors={['#1c1c1c', '#2c2c2c']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#42a5f5" />
              </TouchableOpacity>
              <Text style={styles.settingsHeading}>Settings</Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => setShowProfileModal(true)}
            >
              <Text style={styles.optionText}>Profile Information</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <Text style={styles.optionText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => navigation.navigate('SubscriptionScreen')}
            >
              <Text style={styles.optionText}>Manage Subscriptions</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={deleteAccount}
            >
              <Text style={[styles.optionText, styles.dangerText]}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={20} color="#ff6347" />
            </TouchableOpacity>
          </View>

          {/* Notifications Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.switchRow}>
              <Text style={styles.optionText}>Push Notifications</Text>
              <Switch 
                value={notificationsEnabled} 
                onValueChange={toggleNotifications}
                thumbColor="#42a5f5" 
                trackColor={{ true: '#4caeff', false: '#555' }} 
              />
            </View>
            
            {notificationsEnabled && (
              <>
                <View style={styles.switchRow}>
                  <Text style={styles.optionText}>Activity Reminders</Text>
                  <Switch 
                    value={reminderNotifications} 
                    onValueChange={(value) => {
                      setReminderNotifications(value);
                      saveSettings('reminderNotifications', value);
                    }}
                    thumbColor="#42a5f5" 
                    trackColor={{ true: '#4caeff', false: '#555' }} 
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.optionText}>Chat Notifications</Text>
                  <Switch 
                    value={chatNotifications} 
                    onValueChange={(value) => {
                      setChatNotifications(value);
                      saveSettings('chatNotifications', value);
                    }}
                    thumbColor="#42a5f5" 
                    trackColor={{ true: '#4caeff', false: '#555' }} 
                  />
                </View>
              </>
            )}
          </View>

          {/* Appearance Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.switchRow}>
              <Text style={styles.optionText}>Dark Mode</Text>
              <Switch 
                value={darkMode} 
                onValueChange={(value) => {
                  setDarkMode(value);
                  saveSettings('darkMode', value);
                }}
                thumbColor="#42a5f5" 
                trackColor={{ true: '#4caeff', false: '#555' }} 
              />
            </View>
            <TouchableOpacity style={styles.optionButton} onPress={() => setShowLanguageModal(true)}>
              <Text style={styles.optionText}>Language</Text>
              <Text style={styles.secondaryText}>{language}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => setShowFontSizeModal(true)}>
              <Text style={styles.optionText}>Text Size</Text>
              <Text style={styles.secondaryText}>{fontSize}</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <View style={styles.switchRow}>
              <Text style={styles.optionText}>Data Collection</Text>
              <Switch 
                value={dataCollection} 
                onValueChange={(value) => {
                  setDataCollection(value);
                  saveSettings('dataCollection', value);
                }}
                thumbColor="#42a5f5" 
                trackColor={{ true: '#4caeff', false: '#555' }} 
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.optionText}>Mood Tracking</Text>
              <Switch 
                value={moodTracking} 
                onValueChange={(value) => {
                  setMoodTracking(value);
                  saveSettings('moodTracking', value);
                }}
                thumbColor="#42a5f5" 
                trackColor={{ true: '#4caeff', false: '#555' }} 
              />
            </View>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={downloadUserData}
            >
              <Text style={styles.optionText}>Download My Data</Text>
              <Ionicons name="download-outline" size={20} color="#bbb" />
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity style={styles.optionButton} onPress={openPrivacyPolicy}>
              <Text style={styles.optionText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={openTermsOfService}>
              <Text style={styles.optionText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={contactSupport}>
              <Text style={styles.optionText}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Text style={styles.optionText}>App Version</Text>
              <Text style={styles.secondaryText}>1.0.0</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Profile Information Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={userProfile.name}
              onChangeText={(text) => setUserProfile({...userProfile, name: text})}
              placeholder="Your Name"
              placeholderTextColor="#777"
            />
            
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={userProfile.email}
              onChangeText={(text) => setUserProfile({...userProfile, email: text})}
              placeholder="your.email@example.com"
              placeholderTextColor="#777"
              keyboardType="email-address"
            />
            
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={userProfile.phone}
              onChangeText={(text) => setUserProfile({...userProfile, phone: text})}
              placeholder="Your Phone Number"
              placeholderTextColor="#777"
              keyboardType="phone-pad"
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={updateProfile}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
              placeholder="Enter current password"
              placeholderTextColor="#777"
              secureTextEntry
            />
            
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
              placeholder="Enter new password"
              placeholderTextColor="#777"
              secureTextEntry
            />
            
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
              placeholder="Confirm new password"
              placeholderTextColor="#777"
              secureTextEntry
            />
            
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {languages.map((lang, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.modalOption,
                  language === lang && styles.selectedOption
                ]}
                onPress={() => {
                  setLanguage(lang);
                  saveSettings('language', lang);
                  setShowLanguageModal(false);
                }}
              >
                <Text 
                  style={[
                    styles.modalOptionText,
                    language === lang && styles.selectedOptionText
                  ]}
                >
                  {lang}
                </Text>
                {language === lang && (
                  <Ionicons name="checkmark" size={24} color="#42a5f5" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Font Size Selection Modal */}
      <Modal
        visible={showFontSizeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Text Size</Text>
            {fontSizes.map((size, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.modalOption,
                  fontSize === size && styles.selectedOption
                ]}
                onPress={() => {
                  setFontSize(size);
                  saveSettings('fontSize', size);
                  setShowFontSizeModal(false);
                }}
              >
                <Text 
                  style={[
                    styles.modalOptionText,
                    fontSize === size && styles.selectedOptionText,
                    size === 'Small' && { fontSize: 14 },
                    size === 'Medium' && { fontSize: 16 },
                    size === 'Large' && { fontSize: 18 },
                    size === 'Extra Large' && { fontSize: 20 },
                  ]}
                >
                  {size}
                </Text>
                {fontSize === size && (
                  <Ionicons name="checkmark" size={24} color="#42a5f5" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowFontSizeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        {[ 
          { icon: 'home-outline', label: 'Home', route: 'Dashboard' },
          { icon: 'chatbubble-outline', label: 'Chat', route: 'ChatbotScreen' },
          { icon: 'calendar-outline', label: 'Bookings', route: 'BookingScreen' },
          { icon: 'search-outline', label: 'Search', action: toggleSearch },
          { icon: 'settings-outline', label: 'Settings', route: 'SettingsPage' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => (item.route ? navigation.navigate(item.route) : item.action())}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={item.label === 'Settings' ? '#14B8A6' : '#9CA3AF'}
            />
            <Text style={[
              styles.navLabel,
              item.label === 'Settings' ? styles.activeNavLabel : {}
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#9CA3AF"
          value={searchInput}
          onChangeText={setSearchInput}
        />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { paddingVertical: 20, paddingHorizontal: 15, paddingBottom: 80 },
  header: { marginBottom: 20, alignItems: 'flex-start', marginTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 10 },
  settingsHeading: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  settingsSection: { backgroundColor: '#2e2f33', borderRadius: 15, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, color: '#fff', marginBottom: 15 },
  optionButton: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomColor: '#444', borderBottomWidth: 1 },
  optionText: { fontSize: 16, color: '#bbb' },
  secondaryText: { fontSize: 14, color: '#4caeff' },
  dangerText: { color: '#ff6347' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomColor: '#444', borderBottomWidth: 1 },
  logoutButton: { backgroundColor: '#ff6347', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  navbar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 80, 
    backgroundColor: '#1c1c1c', 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingHorizontal: 10,
    paddingVertical: 12
  },
  navItem: { 
    alignItems: 'center',
    paddingHorizontal: 8
  },
  navLabel: { 
    color: 'white', 
    fontSize: 12, 
    marginTop: 5 
  },
  activeNavLabel: { 
    color: '#14B8A6',
    fontWeight: 'bold'
  },
  searchContainer: { position: 'absolute', bottom: 10, left: 20, right: 20, backgroundColor: '#333', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15 },
  searchInput: { fontSize: 16, color: '#fff' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#2e2f33',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  selectedOption: {
    backgroundColor: 'rgba(66, 165, 245, 0.1)',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#bbb',
  },
  selectedOptionText: {
    color: '#42a5f5',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
  },
  inputLabel: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#555',
  },
  saveModalButton: {
    backgroundColor: '#42a5f5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6347',
    marginBottom: 15,
    fontSize: 14,
  },
});

export default SettingsPage;
