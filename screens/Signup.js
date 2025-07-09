import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../services/firebaseConfig'; // Direct import of auth and firestore
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

const Signup = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [modalVisible, setModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSignup = async () => {
    const { name, email, password, confirmPassword } = form;
  
    if (!name || !email || !password || !confirmPassword) {
      alert('Please fill out all fields');
      return;
    }
  
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
  
    setIsLoading(true); // Show spinner
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await addDoc(collection(firestore, 'users'), {
        name: name,
        email: email,
        uid: user.uid,
      });
  
      setModalVisible(true);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false); // Hide spinner
    }
  };
  

  WebBrowser.maybeCompleteAuthSession();

  // Google Auth configuration
  const GOOGLE_WEB_CLIENT_ID = "339812618356-fja5ni810fnpqvedgsa2i5ahspqg3rrc.apps.googleusercontent.com";
  const GOOGLE_EXPO_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;
  const GOOGLE_ANDROID_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;
  const GOOGLE_IOS_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;

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

  // Monitor for Google response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
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

  // Handle Google successful sign-in response
  const handleGoogleResponse = async (response) => {
    try {
      setIsLoading(true);
      
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
        const user = userCredential.user;
        
        // Save user details in Firestore
        const userRef = collection(firestore, 'users');
        const existingUser = (await getDocs(userRef)).docs.find(doc => doc.data().email === user.email);

        if (!existingUser) {
          await addDoc(userRef, {
            name: user.displayName || userData.name,
            email: user.email,
            uid: user.uid,
          });
        }
        
        setModalVisible(true); // Show success modal
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
      setIsLoading(false);
    }
  };

  // Update Google Signup button press handler
  const handleGoogleSignup = () => {
    try {
      if (!request) {
        Alert.alert(
          'Google Sign-In Unavailable',
          'Google authentication is not properly configured. Please check your client IDs in the app code.',
          [{ text: 'OK' }]
        );
        return;
      }
      setIsLoading(true);
      promptAsync();
    } catch (error) {
      console.error('Google Sign-In Error:', error.message);
      Alert.alert('Error', error.message);
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#141E30', '#243B55']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Welcome to MindfulSpace</Text>
        <Text style={styles.subtitle}>Create an account to get started</Text>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#AAB2BD"
            value={form.name}
            onChangeText={(value) => handleInputChange('name', value)}
          />
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
            secureTextEntry={true}
            value={form.password}
            onChangeText={(value) => handleInputChange('password', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#AAB2BD"
            secureTextEntry={true}
            value={form.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
          />
        </View>

        {/* Signup Button */}
        <TouchableOpacity
  style={[styles.signupButton, isLoading && { opacity: 0.7 }]} // Reduce opacity when loading
  onPress={handleSignup}
  disabled={isLoading} // Disable button when loading
>
  {isLoading ? (
    <ActivityIndicator size="small" color="#FFFFFF" />
  ) : (
    <Text style={styles.signupButtonText}>Sign Up</Text>
  )}
</TouchableOpacity>


        {/* Google Signup Button */}
        <TouchableOpacity 
          style={[styles.googleButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleGoogleSignup}
          disabled={isLoading}
        >
          <View style={styles.googleContent}>
            {isLoading ? (
              <ActivityIndicator color="#4285F4" style={styles.googleIcon} />
            ) : (
              <Image
                source={require('../assets/images/google-icon.png')}
                style={styles.googleIcon}
              />
            )}
            <Text style={styles.googleButtonText}>
              {isLoading ? 'Processing...' : 'Sign Up with Google'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Login Redirect */}
        <View style={styles.loginRedirect}>
          <Text style={styles.redirectText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.redirectLink}> Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Registration Successful!</Text>
              <Text style={styles.modalText}>You have successfully created an account.</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('Login'); // Redirect to login after closing the modal
                }}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    height: 50, // Keep input box size consistent
  },
  signupButton: {
    backgroundColor: '#1B73B3',
    borderRadius: 25,
    paddingVertical: 14,
    marginBottom: 15,
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 14,
    marginBottom: 15,
    alignItems: 'center',
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
    fontSize: 16,
    color: 'black',
  },
  loginRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  redirectText: {
    color: '#AAB2BD',
  },
  redirectLink: {
    color: '#1B73B3',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B73B3',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#1B73B3',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default Signup;
