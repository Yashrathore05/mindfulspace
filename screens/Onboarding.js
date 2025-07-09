import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Onboarding = ({ navigation }) => {
  useEffect(() => {
    // Check if user is already logged in
    const checkLoginStatus = async () => {
      const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
      if (userLoggedIn === 'true') {
        navigation.navigate('Dashboard'); // Redirect to Dashboard if logged in
      }
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#8E2DE2', '#4A00E0']}
      style={styles.container}
    >
      {/* Logo at the top */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/logo1.png')} style={styles.logo} />
      </View>

      {/* Tagline and image in the center */}
      <View style={styles.centerContent}>
        <Image source={require('../assets/images/onboarding-image.png')} style={styles.image} />
        <Text style={styles.tagline}>
          "Your journey to mental wellness begins here."
        </Text>
      </View>

      {/* Login and Signup buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>Signup</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Project by Yash & Shivansh</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginTop: 50,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  centerContent: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: 580,
    height: 280,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 20,
    textAlign: 'center',
    color: '#FFF',
    fontWeight: '600',
    fontStyle: 'italic',
    marginHorizontal: 20,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 30,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  signupButton: {
    borderColor: '#FFF',
    borderWidth: 2,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default Onboarding;
