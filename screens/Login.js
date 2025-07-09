import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../services/firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

// Google Auth configuration
// Client ID from provided configuration
const GOOGLE_WEB_CLIENT_ID = "339812618356-fja5ni810fnpqvedgsa2i5ahspqg3rrc.apps.googleusercontent.com";
const GOOGLE_EXPO_CLIENT_ID = GOOGLE_WEB_CLIENT_ID; // Use the same client ID for Expo
const GOOGLE_ANDROID_CLIENT_ID = GOOGLE_WEB_CLIENT_ID; // Use the same until you have a specific Android client ID
const GOOGLE_IOS_CLIENT_ID = GOOGLE_WEB_CLIENT_ID; // Use the same until you have a specific iOS client ID

const Login = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Sign-In Configuration with proper scopes and prompt behavior
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_EXPO_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    promptParams: {
      prompt: 'select_account',
    },
  });

  // Handle Google Sign-in
  useEffect(() => {
    if (response?.type === 'success') {
      setGoogleLoading(true);
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      setGoogleLoading(false);
      console.error('Google Sign In Error:', response.error);
      Alert.alert(
        'Google Sign-In Error',
        `Error: ${response.error?.message || 'Unknown error occurred'}. Make sure your Google Cloud project is properly configured.`,
        [
          { 
            text: 'Learn More', 
            onPress: () => Linking.openURL('https://docs.expo.dev/guides/authentication/#google')
          },
          { text: 'OK' }
        ]
      );
    }
  }, [response]);

  // Handle Google successful sign-in
  const handleGoogleResponse = async (response) => {
    try {
      // Get ID token and access token
      const { id_token, access_token } = response.params;
      
      // Log successful authentication
      console.log('Successfully authenticated with Google');
      
      // Get user info if access token is available
      if (access_token) {
        // Getting user data directly from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        
        const userData = await userInfoResponse.json();
        console.log('Google user data:', userData);
        
        // Create credential and sign in to Firebase
        const credential = GoogleAuthProvider.credential(id_token, access_token);
        const userCredential = await signInWithCredential(auth, credential);
        console.log('Firebase sign-in successful with Google credentials');
        
        // Store user data
        await storeUserData(userCredential.user);
        
        // Navigate to Dashboard
        navigation.navigate('Dashboard');
      } else {
        throw new Error('Access token not available in response');
      }
    } catch (error) {
      console.error('Error with Google auth:', error);
      Alert.alert(
        'Authentication Error', 
        'Failed to authenticate with Google. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
      if (userLoggedIn === 'true') {
        navigation.navigate('Dashboard');
      }
    };

    checkLoginStatus();

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        // Store user data
        storeUserData(user);
        navigation.navigate('Dashboard');
      } else {
        AsyncStorage.removeItem('userLoggedIn');
        AsyncStorage.removeItem('userName');
        AsyncStorage.removeItem('userEmail');
        AsyncStorage.removeItem('userId');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      console.log('User logged in:', userCredential.user);
      
      // Store user data and wait for it to complete
      await storeUserData(userCredential.user);
      
      // Verify data was stored
      const storedName = await AsyncStorage.getItem('userName');
      console.log('Stored name verification:', storedName);
      
      // Add a small delay to ensure AsyncStorage writes are complete
      setTimeout(() => {
      navigation.navigate('Dashboard');
      }, 300);
    } catch (error) {
      console.error('Error signing in:', error.message);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Store user data to AsyncStorage with more robust handling
  const storeUserData = async (user) => {
    if (!user) {
      console.error('No user data provided to storeUserData');
      return;
    }
    
    try {
      console.log('Storing user data for:', user.email);
      
      // Store login status
      await AsyncStorage.setItem('userLoggedIn', 'true');
      
      // Store user ID
      if (user.uid) {
        await AsyncStorage.setItem('userId', user.uid);
      }
      
      // Store email
      if (user.email) {
        await AsyncStorage.setItem('userEmail', user.email);
      }
      
      // Store display name with fallback to email
      let displayName = user.displayName;
      if (!displayName && user.email) {
        displayName = user.email.split('@')[0];
      }
      
      if (displayName) {
        console.log('Storing username:', displayName);
        await AsyncStorage.setItem('userName', displayName);
        
        // Double-check storage success
        const storedName = await AsyncStorage.getItem('userName');
        console.log('Verification - stored name:', storedName);
      } else {
        console.warn('No display name available to store');
      }
    } catch (error) {
      console.error('Error storing user data:', error);
      // Try with a simpler approach as fallback
      try {
        await AsyncStorage.setItem('userName', user.email ? user.email.split('@')[0] : 'User');
      } catch (e) {
        console.error('Fallback storage also failed:', e);
      }
    }
  };

  return (
    <LinearGradient colors={['#141E30', '#243B55']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Welcome Back to MindfulSpace</Text>
        <Text style={styles.subtitle}>Log in to continue</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#AAB2BD"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#AAB2BD"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => handleInputChange('password', value)}
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && { backgroundColor: '#3D5368' }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.googleButton, googleLoading && { backgroundColor: '#e0e0e0' }]} 
          onPress={() => {
            if (!request) {
              Alert.alert(
                'Google Sign-In Unavailable',
                'Google authentication is not properly configured. Please check your client IDs in the app code.',
                [{ text: 'OK' }]
              );
              return;
            }
            setGoogleLoading(true);
            promptAsync();
          }}
          disabled={googleLoading}
        >
          <View style={styles.googleContent}>
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" style={styles.googleIcon} />
            ) : (
            <Image
              source={require('../assets/images/google-icon.png')}
              style={styles.googleIcon}
            />
            )}
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Signing in...' : 'Log in with Google'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.signupRedirect}>
          <Text style={styles.redirectText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.redirectLink}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAB2BD',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1E2A38',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3D5368',
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#141E30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  redirectText: {
    color: '#AAB2BD',
    fontSize: 14,
  },
  redirectLink: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Login;
