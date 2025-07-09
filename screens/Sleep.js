import React, { useState, useRef } from 'react';
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
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

const Mindfulness = () => {
  const navigation = useNavigation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const searchAnim = useState(new Animated.Value(0))[0];

  // Reference for the video player
  const videoRef = useRef(null);

  // Toggle search visibility
  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    Animated.timing(searchAnim, {
      toValue: searchVisible ? 0 : 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Open Video in Fullscreen
  const openFullscreen = async () => {
    if (videoRef.current) {
      await videoRef.current.presentFullscreenPlayer();
    }
  };

  return (
    <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Sleep Wellness</Text>
          </View>

          {/* Sleep Wellness */}
          <View style={styles.card}>
            <Image source={require('../assets/sleep.png')} style={styles.cardImage} />
            <Text style={styles.cardText}>
              Quality sleep is vital for overall health. A good night's sleep helps with mental clarity, emotional stability, and overall wellness.
            </Text>
          </View>

          {/* Video Section */}
          <Text style={styles.sectionTitle}>🌟 Featured Video of the Week</Text>
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={require('../assets/sleep.mp4')}
              style={styles.video}
              shouldPlay
              isLooping
              useNativeControls
              isMuted={isMuted}
              resizeMode="contain"
            />
            {/* Mute Button */}
            <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
              <Ionicons
                name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                size={30}
                color="#FFF"
              />
              <Text style={styles.muteText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
            {/* Fullscreen Button */}
            <TouchableOpacity onPress={openFullscreen} style={styles.fullscreenButton}>
              <Ionicons name="expand-outline" size={30} color="#FFF" />
            </TouchableOpacity>
          </View>
          {/* Fullscreen Message */}
          <Text style={styles.fullscreenText}>📺 Open in fullscreen mode for better viewing experience.</Text>

           {/* Article Section */}
           <View style={styles.card}>
            <Text style={styles.sectionTitle}>Benefits of Good Sleep</Text>
            <Text style={styles.articleText}>
              Sleep is essential for restoring energy and supporting cognitive function. Good sleep can improve mood, increase alertness, and boost productivity.
            </Text>
          </View>

          {/* FAQ Section */}
          <Text style={styles.sectionTitle}>Sleep Wellness FAQ</Text>
          <View style={styles.faqContainer}>
            {[ 
              { question: '1. How much sleep do I need?', answer: 'On average, adults need 7-9 hours of sleep per night for optimal health.' },
              { question: '2. What are the signs of poor sleep?', answer: 'Symptoms include fatigue, irritability, difficulty concentrating, and poor mood.' },
              { question: '3. How can I improve my sleep quality?', answer: 'Maintain a regular sleep schedule, create a relaxing bedtime routine, and avoid caffeine or electronics before bed.' },
              { question: '4. What should I do if I have trouble sleeping?', answer: 'Consider relaxation techniques such as deep breathing, meditation, or a warm bath before bed.' },
              { question: '5. Is it okay to nap during the day?', answer: 'Short naps (20-30 minutes) can be beneficial, but avoid long naps late in the afternoon.' },
            ].map((faq, index) => (
              <TouchableOpacity key={index} style={styles.faqCard} onPress={() => toggleFAQ(index)}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedFAQ === index && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Expert Views Section */}
          <Text style={styles.sectionTitle}>Expert Views</Text>
          <View style={styles.expertCard}>
            <Image source={require('../assets/doctor1.png')} style={styles.expertImage} />
            <Text style={styles.expertName}>Dr. Sarah White</Text>
            <Text style={styles.expertComment}>
              "Sleep is critical for both physical and mental health. Prioritize it in your routine for better long-term wellness."
            </Text>
          </View>
          <View style={styles.expertCard}>
            <Image source={require('../assets/doctor2.png')} style={styles.expertImage} />
            <Text style={styles.expertName}>Dr. Michael Lee</Text>
            <Text style={styles.expertComment}>
              "Good sleep helps with healing, memory retention, and enhances your immune system. Make it a non-negotiable part of your health regimen."
            </Text>
          </View>


        </ScrollView>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        {[ 
          { icon: 'home-outline', label: 'Home', route: 'Dashboard' },
          { icon: 'chatbubble-outline', label: 'Chat', route: 'ChatbotScreen' },
          { icon: 'search-outline', label: 'Search', action: toggleSearch },
          { icon: 'calendar', label: 'Bookings', route: 'BookingScreen' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => (item.route ? navigation.navigate(item.route) : item.action())}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={item.label === 'Home' ? '#9CA3AF' : '#9CA3AF'}  // Change color when Home is selected
            />
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input at the bottom */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [
              {
                translateY: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0], // Moves up when visible
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
  container: { flex: 1, paddingTop: 40 },
  safeArea: { flex: 1, paddingHorizontal: 10 },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    paddingVertical: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
  },
  navItem: {
    alignItems: 'center',
  },
  navLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
  },
  searchInput: {
    flex: 1,
    color: '#F9FAFB',
  },
  scrollContainer: { paddingBottom: 90 },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 30, color: '#E2E8F0', fontWeight: '600' },
  card: { backgroundColor: '#1E40AF', borderRadius: 15, padding: 20, marginBottom: 35, alignItems: 'center' },
  cardImage: { width: 180, height: 180, marginBottom: 15, borderRadius: 10 },
  cardText: { color: '#F9FAFB', fontSize: 16, textAlign: 'center', },
  sectionTitle: { color: '#F9FAFB', fontSize: 20, marginVertical: 15 },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, marginBottom: 10, backgroundColor: '#000', borderRadius: 10 },
  video: { width: '100%', height: '100%', borderRadius: 10 },
  muteButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 50 },
  muteText: { color: '#FFF', marginTop: 5, fontSize: 12 },
  fullscreenButton: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 50 },
  fullscreenText: { textAlign: 'center', color: '#9CA3AF', marginBottom: 60, fontSize: 14 },
  faqContainer: { marginBottom: 25 },
  faqCard: { backgroundColor: '#1E40AF', borderRadius: 10, padding: 15, marginBottom: 10 },
  faqQuestion: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  faqAnswer: { color: '#F9FAFB', fontSize: 14, marginTop: 10 },
  articleText: { color: '#F9FAFB', fontSize: 14, lineHeight: 22, marginBottom: 15 },
  expertCard: { backgroundColor: '#374151', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  expertImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  expertName: { fontSize: 18, color: '#F9FAFB', fontWeight: '600' },
  expertComment: { color: '#A5B4FC', textAlign: 'center', fontSize: 14 },
});

export default Mindfulness;
