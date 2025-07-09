import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Register for the redirect
WebBrowser.maybeCompleteAuthSession();

// Use the same client ID as in your Login.js
const CLIENT_ID = "339812618356-fja5ni810fnpqvedgsa2i5ahspqg3rrc.apps.googleusercontent.com";

export default function GoogleSignInDebug() {
  const [log, setLog] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  
  const addLog = (message) => {
    console.log(message);
    setLog(prevLog => [...prevLog, `${new Date().toISOString().substr(11, 8)}: ${message}`]);
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: CLIENT_ID,
    webClientId: CLIENT_ID,
    scopes: ['profile', 'email']
  });

  useEffect(() => {
    if (response?.type === 'success') {
      addLog(`Auth success! Type: ${response.type}`);
      addLog(`Access token received: ${response.params.access_token.substr(0, 5)}...`);
      setAccessToken(response.params.access_token);
      
      // Get user info
      getUserInfo(response.params.access_token);
    } else if (response) {
      addLog(`Response type: ${response.type}`);
      if (response.type === 'error') {
        addLog(`Error: ${JSON.stringify(response.error)}`);
      }
    }
  }, [response]);

  const getUserInfo = async (token) => {
    try {
      addLog('Fetching user info from Google...');
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const userData = await userInfoResponse.json();
      addLog(`User info received: ${JSON.stringify(userData)}`);
    } catch (error) {
      addLog(`Error getting user info: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Sign-In Debug</Text>
      
      <Button
        title={accessToken ? "Sign in successful!" : "Test Google Sign In"}
        onPress={() => {
          addLog('Starting Google Auth...');
          promptAsync();
        }}
        disabled={!request || accessToken}
      />
      
      {accessToken && (
        <Text style={styles.success}>Authentication successful!</Text>
      )}
      
      <Text style={styles.logTitle}>Debug Log:</Text>
      <ScrollView style={styles.logContainer}>
        {log.length === 0 ? (
          <Text style={styles.emptyLog}>No logs yet. Press the button to start.</Text>
        ) : (
          log.map((entry, index) => (
            <Text key={index} style={styles.logEntry}>{entry}</Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 10,
  },
  logEntry: {
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
  emptyLog: {
    color: '#AAA',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
}); 