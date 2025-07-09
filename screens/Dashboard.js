import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  TextInput,
  Animated,
  Linking,
  Easing,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebaseConfig';

const Dashboard = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('User');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const searchAnim = useRef(new Animated.Value(0)).current;
  const [hasMoodAssessments, setHasMoodAssessments] = useState(false);

  // Get user data from AsyncStorage with better handling
  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log('Attempting to fetch user name from AsyncStorage');
        const storedName = await AsyncStorage.getItem('userName');
        console.log('Stored name from AsyncStorage:', storedName);
        
        if (storedName && storedName.trim() !== '') {
          setUserName(storedName);
          console.log('Username set to:', storedName);
        } else {
          console.log('No stored name found, using default');
          // Try to get user email as fallback
          const email = await AsyncStorage.getItem('userEmail');
          if (email) {
            const nameFromEmail = email.split('@')[0];
            setUserName(nameFromEmail);
            await AsyncStorage.setItem('userName', nameFromEmail);
            console.log('Username set from email:', nameFromEmail);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    getUserData();
    
    // Add Firebase auth state listener as a backup
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const displayName = user.displayName || (user.email && user.email.split('@')[0]) || 'User';
        setUserName(displayName);
        
        // Store again in case it was missing
        AsyncStorage.setItem('userName', displayName)
          .then(() => console.log('Username stored from auth state:', displayName))
          .catch(err => console.error('Error storing username:', err));
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Force re-fetch user data when component is focused
  useEffect(() => {
    const focusListener = navigation.addListener('focus', async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        if (storedName && storedName.trim() !== '') {
          setUserName(storedName);
          console.log('Username updated on focus:', storedName);
        }
      } catch (error) {
        console.error('Error re-fetching user data on focus:', error);
      }
    });
    
    return focusListener;
  }, [navigation]);

  // Items that can be searched
  const allItems = [
    { name: 'Mindfulness', type: 'wellness', route: 'Mindfulness' },
    { name: 'Breathing', type: 'wellness', route: 'Breathing' },
    { name: 'Affirmations', type: 'wellness', route: 'Affirmations' },
    { name: 'Healthy Eating', type: 'wellness', route: 'HealthyEating' },
    { name: 'Sleep Wellness', type: 'wellness', route: 'Sleep' },
    { name: 'Mental Health Chat', type: 'feature', route: 'ChatbotScreen' },
    { name: 'Mood Tracking', type: 'feature', route: 'ChatbotScreen' },
    { name: 'Consultation', type: 'feature', route: 'ConsultationPage' },
    { name: 'AI Therapy', type: 'premium', route: 'TherapySessionScreen' },
    { name: 'Premium Plans', type: 'premium', route: 'SubscriptionScreen' },
    { name: 'Settings', type: 'feature', route: 'SettingsPage' },
  ];

  // Filtered search results
  const [searchResults, setSearchResults] = useState([]);

  // Handle search input changes
  useEffect(() => {
    if (searchInput.length > 0) {
      const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchInput]);

  // Toggle search visibility with improved animation
  const toggleSearch = () => {
    if (!searchVisible) {
      setSearchVisible(true);
    Animated.timing(searchAnim, {
        toValue: 1,
      duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
    }).start();
    } else {
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setSearchVisible(false);
        setSearchInput('');
        setSearchResults([]);
      });
    }
  };

  // Handle search result selection
  const handleSearchItemPress = (item) => {
    toggleSearch();
    navigation.navigate(item.route);
  };

  const logout = async () => {
    try {
      await auth.signOut();
      alert('Logged out successfully.');
      navigation.navigate('Login');
    } catch (error) {
      alert('Failed to log out.');
    }
  };

  // Add useEffect to check for existing mood assessments
  useEffect(() => {
    const checkForMoodAssessments = async () => {
      try {
        // This is a simple check to see if the user has any mood assessments
        const user = auth.currentUser;
        if (!user) return;
        
        const conversationsRef = collection(firestore, 'conversations');
        const moodConversationsQuery = query(
          conversationsRef,
          where('userId', '==', user.uid),
          where('title', '==', 'Mood Assessment')
        );
        
        const moodConversationsSnapshot = await getDocs(moodConversationsQuery);
        setHasMoodAssessments(moodConversationsSnapshot.size > 0);
      } catch (error) {
        console.error('Error checking for mood assessments:', error);
        setHasMoodAssessments(false);
      }
    };
    
    checkForMoodAssessments();
  }, []);

  return (
    <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={true}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Hello, {userName} 👋</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

           {/* Wellness Tips */}
           <Text style={styles.sectionTitle}>Explore Wellness</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            bounces={true}
            decelerationRate="fast"
            style={styles.horizontalScroll}
          >
            {[
              { tip: 'Mindfulness', image: require('../assets/welcome-image.png'), page: 'Mindfulness' },
              { tip: 'Breathing', image: require('../assets/breath.png'), page: 'Breathing' },
              { tip: 'Affirmations', image: require('../assets/affir.png'), page: 'Affirmations' },
              { tip: 'Healthy Eating', image: require('../assets/eat.png'), page: 'HealthyEating' },
              { tip: 'Sleep Wellness', image: require('../assets/sleep.png'), page: 'Sleep' }
            ].map((wellness, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tipCard}
                onPress={() => navigation.navigate(wellness.page)} // Navigate to respective page
              >
                <Image source={wellness.image} style={styles.tipImage} />
                <Text style={styles.tipText}>{wellness.tip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Mood Tracker */}
          <Text style={styles.sectionTitle}>Track Your Mood</Text>
          <TouchableOpacity style={styles.moodTrackerCard}>
            <Ionicons name="happy-outline" size={50} color="#14B8A6" />
            <Text style={styles.moodText}>How are you feeling today?</Text>
            <View style={styles.moodButtonContainer}>
              <TouchableOpacity
                style={styles.moodButton}
                onPress={() => navigation.navigate('ChatbotScreen')}
              >
                <Text style={styles.moodButtonText}>Log My Mood</Text>
              </TouchableOpacity>
              {hasMoodAssessments && (
                <TouchableOpacity
                  style={[styles.moodButton, styles.gardenButton]}
                  onPress={() => navigation.navigate('MoodGardenScreen')}
                >
                  <Text style={[styles.moodButtonText, styles.gardenButtonText]}>View Garden</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          {/* AI Therapy */}
          <View style={styles.premiumSectionHeader}>
            <Text style={styles.sectionTitle}>AI Therapy</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.therapyCard}
            onPress={() => navigation.navigate('TherapySessionScreen')}
          >
            <View style={styles.therapyContent}>
              <View style={[styles.therapyIconContainer, { backgroundColor: 'rgba(66, 165, 245, 0.2)' }]}>
                <Ionicons name="person-outline" size={36} color="#42a5f5" />
              </View>
              <View style={styles.therapyTextContainer}>
                <Text style={styles.therapyTitle}>AI Therapy Assistant</Text>
                <Text style={styles.therapyDescription}>
                  Experience personalized therapy sessions with our advanced AI therapist
                </Text>
              </View>
            </View>
            <View style={styles.therapyButtonRow}>
              <TouchableOpacity 
                style={styles.therapyButton}
                onPress={() => navigation.navigate('TherapySessionScreen')}
              >
                <Text style={styles.therapyButtonText}>Start Session</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.therapyButton, styles.therapyLearnButton]}
                onPress={() => navigation.navigate('SubscriptionScreen')}
              >
                <Text style={[styles.therapyButtonText, styles.therapyLearnButtonText]}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Voice Therapy */}
          <View style={styles.premiumSectionHeader}>
            <Text style={styles.sectionTitle}>Voice Therapy</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>NEW</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.therapyCard}
            onPress={() => navigation.navigate('VoiceTherapyScreen')}
          >
            <View style={styles.therapyContent}>
              <View style={[styles.therapyIconContainer, { backgroundColor: 'rgba(156, 39, 176, 0.2)' }]}>
                <Ionicons name="mic-outline" size={36} color="#9c27b0" />
              </View>
              <View style={styles.therapyTextContainer}>
                <Text style={styles.therapyTitle}>Voice-Based Therapy</Text>
                <Text style={styles.therapyDescription}>
                  Natural conversations with AI therapy through voice interaction
                </Text>
              </View>
            </View>
            <View style={styles.therapyButtonRow}>
              <TouchableOpacity 
                style={[styles.therapyButton, { backgroundColor: '#9c27b0' }]}
                onPress={() => navigation.navigate('VoiceTherapyScreen')}
              >
                <Text style={styles.therapyButtonText}>Start Voice Session</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.therapyButton, styles.therapyLearnButton, { borderColor: '#9c27b0' }]}
                onPress={() => navigation.navigate('SubscriptionScreen')}
              >
                <Text style={[styles.therapyButtonText, styles.therapyLearnButtonText, { color: '#9c27b0' }]}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* AI-Powered Mood Garden */}
          <View style={styles.premiumSectionHeader}>
            <Text style={styles.sectionTitle}>AI-Powered Mood Garden</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.therapyCard}
            onPress={() => navigation.navigate('MoodGardenScreen')}
          >
            <View style={styles.therapyContent}>
              <View style={[styles.therapyIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
                <Ionicons name="leaf-outline" size={36} color="#4CAF50" />
              </View>
              <View style={styles.therapyTextContainer}>
                <Text style={styles.therapyTitle}>Interactive Mood Visualization</Text>
                <Text style={styles.therapyDescription}>
                  Watch your garden grow based on your mood logs, with unique plants for each emotion
                </Text>
              </View>
            </View>
            <View style={styles.therapyButtonRow}>
              <TouchableOpacity 
                style={[styles.therapyButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => navigation.navigate('MoodGardenScreen')}
              >
                <Text style={styles.therapyButtonText}>Visit Garden</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.therapyButton, styles.therapyLearnButton, { borderColor: '#4CAF50' }]}
                onPress={() => navigation.navigate('SubscriptionScreen')}
              >
                <Text style={[styles.therapyButtonText, styles.therapyLearnButtonText, { color: '#4CAF50' }]}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Consult with Mental Health Experts */}
          <Text style={styles.sectionTitle}>Consult with Health Experts</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            bounces={true}
            decelerationRate="fast"
            style={styles.horizontalScroll}
          >
            {[
              { image: require('../assets/doctor1.png'), role: 'Nutritionist' },
              { image: require('../assets/doctor2.png'), role: 'Psychologist' },
              { image: require('../assets/doctor1.png'), role: 'Therapist' },
            ].map((doctor, index) => (
              <View key={index} style={styles.consultCard}>
                <Image source={doctor.image} style={styles.consultImage} />
                <Text style={styles.consultRole}>{doctor.role}</Text>
                <TouchableOpacity 
                  style={styles.consultButton} 
                  onPress={() => navigation.navigate('ConsultationPage',)}
                >
  <Text style={styles.consultButtonText}>Consult Now</Text>
</TouchableOpacity>
              </View>
            ))}
          </ScrollView>

         {/* Resources */}
<Text style={styles.sectionTitle}>Resources for You</Text>
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  overScrollMode="never"
  bounces={true}
  decelerationRate="fast"
>
  {[
    { icon: 'book-outline', label: 'Articles', link: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5508938/' },
    { icon: 'videocam-outline', label: 'Videos', link: 'https://www.youtube.com/playlist?list=PLaAelpJCpnYOo-1sIU9fu9O8OZbXN3sDO' },
    { icon: 'help-circle-outline', label: 'FAQ', link: 'https://www.britannica.com/list/17-questions-about-health-and-wellness-answered' },
    { icon: 'heart-outline', label: 'Support', link: 'https://mw-var3.vercel.app/' }
  ].map((resource, index) => (
    <TouchableOpacity 
      key={index} 
      style={styles.resourceCard} 
      onPress={() => Linking.openURL(resource.link)}
    >
      <Ionicons name={resource.icon} size={30} color="#fff" />
      <Text style={styles.resourceText}>{resource.label}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>

        </ScrollView>
      </SafeAreaView>

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
        color={item.label === 'Home' ? '#14B8A6' : (item.label === 'Search' && searchVisible ? '#14B8A6' : '#9CA3AF')}
      />
      <Text style={[
        styles.navLabel, 
        (item.label === 'Home' || (item.label === 'Search' && searchVisible)) ? styles.activeNavLabel : {}
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Search Overlay */}
      {searchVisible && (
        <Animated.View 
          style={[
            styles.searchOverlay,
            {
              opacity: searchAnim
            }
          ]}
        >
          <TouchableOpacity style={styles.closeSearchButton} onPress={toggleSearch}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Search Input and Results */}
      {searchVisible && (
      <Animated.View
        style={[
          styles.searchContainer,
          {
              opacity: searchAnim,
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
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
              placeholder="Search for wellness features..."
          placeholderTextColor="#9CA3AF"
          value={searchInput}
          onChangeText={setSearchInput}
              autoFocus={true}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInput('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => index.toString()}
              style={styles.searchResults}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => handleSearchItemPress(item)}
                >
                  <Ionicons 
                    name={
                      item.type === 'wellness' 
                        ? 'leaf-outline' 
                        : item.type === 'premium'
                          ? 'star-outline'
                          : 'apps-outline'
                    } 
                    size={20} 
                    color={item.type === 'premium' ? '#42a5f5' : '#14B8A6'} 
                    style={styles.resultIcon}
                  />
                  <Text style={styles.searchResultText}>{item.name}</Text>
                  {item.type === 'premium' && (
                    <View style={styles.searchPremiumBadge}>
                      <Text style={styles.searchPremiumText}>PRO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
      </Animated.View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  closeSearchButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(20,20,20,0.7)',
    borderRadius: 20,
    padding: 10,
    zIndex: 11,
  },
  searchContainer: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    borderRadius: 15,
    padding: 15,
    zIndex: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 15,
    maxHeight: '50%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D3748',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  resultIcon: {
    marginRight: 15,
  },
  searchResultText: {
    color: '#F9FAFB',
    fontSize: 16,
  },
  activeNavLabel: {
    color: '#14B8A6',
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 10,
  },
  scrollContainer: {
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#EF4444',
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#A5B4FC',
    fontWeight: '700',
    marginVertical: 10,
  },
  horizontalScroll: {
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 15,
    marginRight: 15,
    padding: 15,
    width: 180,
    alignItems: 'center',
  },
  tipImage: {
    width: 75,
    height: 75,
    marginBottom: 10,
    borderRadius: 10,
  },
  tipText: {
    fontSize: 16,
    color: '#93C5FD',
    fontWeight: '500',
  },
  moodTrackerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  moodText: {
    fontSize: 18,
    color: '#CBD5E1',
    marginVertical: 10,
    textAlign: 'center',
  },
  moodButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  moodButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  gardenButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginLeft: 10,
  },
  gardenButtonText: {
    color: '#4CAF50',
  },
  consultCard: {
    backgroundColor: '#1F2937',  // Darker background color for contrast
    borderRadius: 15,
    marginRight: 15,
    padding: 15,
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginBottom: 10,
  },
  consultRole: {
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
    marginBottom: 10,
  },
  consultButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  consultButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resourceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 15,
    marginRight: 15,
    padding: 20,
    width: 160,
    alignItems: 'center',
  },
  resourceText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 10,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
  },
  premiumSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  premiumBadge: {
    backgroundColor: '#42a5f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 10,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  therapyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  therapyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  therapyIconContainer: {
    backgroundColor: 'rgba(66, 165, 245, 0.2)',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  therapyTextContainer: {
    flex: 1,
  },
  therapyTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  therapyDescription: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  therapyButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  therapyButton: {
    backgroundColor: '#42a5f5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  therapyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  therapyLearnButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#42a5f5',
    marginRight: 0,
  },
  therapyLearnButtonText: {
    color: '#42a5f5',
  },
  searchPremiumBadge: {
    backgroundColor: '#42a5f5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  searchPremiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Dashboard;
