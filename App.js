import React, { useEffect, useRef, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as Camera from 'expo-camera';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Onboarding from './screens/Onboarding';
import Signup from './screens/Signup';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import ChatbotScreen from './screens/ChatbotScreen';
import Splashscreen from './screens/Splashscreen';
import SettingsPage from './screens/SettingsPage';
import Mindfulness from './screens/Mindfulness';
import Breathing from './screens/Breathing';
import Affirmations from './screens/Affirmations';
import HealthyEating from './screens/HealthyEating';
import Sleep from './screens/Sleep';
import ConsultationPage from './screens/ConsultationPage';
import booking from './screens/booking';
import BookingsScreen from './screens/BookingScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import TherapySessionScreen from './screens/TherapySessionScreen';
import VoiceTherapyScreen from './screens/VoiceTherapyScreen';
import MoodGardenScreen from './screens/MoodGardenScreen';

// Configure notification settings
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const [location, setLocation] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [cameraPermission, setCameraPermission] = useState(null);

  useEffect(() => {
    requestPermissions();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User Tapped Notification:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function requestPermissions() {
    // Request Push Notification permission
    await registerForPushNotificationsAsync();

    // Request Location permission
    let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      console.log('User Location:', loc.coords);
    } else {
      console.log('Location permission denied');
    }

    // Request Camera permission
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(cameraStatus);
    if (cameraStatus === 'granted') {
      console.log('Camera permission granted');
    } else {
      console.log('Camera permission denied');
    }

    // Request Contacts permission
    const { status: contactsStatus } = await Contacts.requestPermissionsAsync();
    if (contactsStatus === 'granted') {
      let { data } = await Contacts.getContactsAsync();
      setContacts(data);
      console.log('Contacts:', data);
    } else {
      console.log('Contacts permission denied');
    }
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splashscreen" component={Splashscreen} />
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="ChatbotScreen" component={ChatbotScreen} />
        <Stack.Screen name="SettingsPage" component={SettingsPage} />
        <Stack.Screen name="Mindfulness" component={Mindfulness} />
        <Stack.Screen name="Breathing" component={Breathing} />
        <Stack.Screen name="Affirmations" component={Affirmations} />
        <Stack.Screen name="HealthyEating" component={HealthyEating} />
        <Stack.Screen name="Sleep" component={Sleep} />
        <Stack.Screen name="ConsultationPage" component={ConsultationPage} />
        <Stack.Screen name="booking" component={booking} />
        <Stack.Screen name="BookingScreen" component={BookingsScreen} />
        <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
        <Stack.Screen name="TherapySessionScreen" component={TherapySessionScreen} />
        <Stack.Screen name="VoiceTherapyScreen" component={VoiceTherapyScreen} />
        <Stack.Screen name="MoodGardenScreen" component={MoodGardenScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Function to register device for push notifications
async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notifications!');
      return;
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

  } else {
    alert('Must use a physical device for push notifications');
  }

  // Set notification channel for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}
