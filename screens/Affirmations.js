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

const Affirmations = () => {
  const navigation = useNavigation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const searchAnim = useState(new Animated.Value(0))[0];

  const videoRef = useRef(null);

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

  const openFullscreen = async () => {
    if (videoRef.current) {
      await videoRef.current.presentFullscreenPlayer();
    }
  };

  return (
    <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Affirmations</Text>
          </View>

          <View style={styles.card}>
            <Image source={require('../assets/affir.png')} style={styles.cardImage} />
            <Text style={styles.cardText}>
              Affirmations help in transforming negative thoughts into positive ones, boosting confidence and self-esteem.
            </Text>
          </View>

          {/* Video Section */}
          <Text style={styles.sectionTitle}>🌟 Featured Video of the Week</Text>
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={require('../assets/Affirmations .mp4')}
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
            <Text style={styles.sectionTitle}>Why Use Affirmations?</Text>
            <Text style={styles.articleText}>
              Affirmations can help in overcoming self-doubt, reprogramming the mind for positivity, and attracting success and abundance.
            </Text>
          </View>

          {/* FAQ Section */}
          <Text style={styles.sectionTitle}>Affirmation FAQ</Text>
          <View style={styles.faqContainer}>
            {[
              { question: '1. What are affirmations?', answer: 'Affirmations are positive statements that challenge and control negative thoughts or self-doubt.' },
              { question: '2. How do affirmations work?', answer: 'By repeating affirmations, the subconscious mind is reprogrammed, and your attitude toward yourself and life improves.' },
              { question: '3. Can affirmations improve mental health?', answer: 'Yes! Consistent affirmation practice can help reduce stress, anxiety, and boost overall well-being.' },
              { question: '4. How often should I practice affirmations?', answer: 'For best results, it is recommended to practice affirmations daily, ideally in the morning or before sleep.' },
              { question: '5. Can affirmations help with achieving goals?', answer: 'Absolutely! Affirmations help you stay focused and motivated to achieve your personal and professional goals.' },
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
            <Text style={styles.expertName}>Dr. Michael Lee</Text>
            <Text style={styles.expertComment}>
              "Affirmations are a powerful tool for creating a positive mindset. A few minutes of affirmations can help build self-belief and confidence."
            </Text>
          </View>
          <View style={styles.expertCard}>
            <Image source={require('../assets/doctor2.png')} style={styles.expertImage} />
            <Text style={styles.expertName}>Dr. Sarah Johnson</Text>
            <Text style={styles.expertComment}>
              "I encourage my patients to practice affirmations for mental clarity. It has shown tremendous benefits in promoting overall mental wellness."
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>

      <View style={styles.navbar}>
        {[
          { icon: 'home-outline', label: 'Home', route: 'Dashboard' },
          { icon: 'chatbubble-outline', label: 'Chat', route: 'ChatbotScreen' },
          { icon: 'search-outline', label: 'Search', action: toggleSearch },
          { icon: 'calendar', label: 'Bookings', route: 'BookingScreen' },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.navItem} onPress={() => (item.route ? navigation.navigate(item.route) : item.action())}>
            <Ionicons name={item.icon} size={22} color="#9CA3AF" />
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
        <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#9CA3AF" value={searchInput} onChangeText={setSearchInput} />
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
  cardText: { color: '#F9FAFB', fontSize: 16, textAlign: 'center' },
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
  expertCard: { backgroundColor: '#374151', padding: 20, borderRadius: 10, marginBottom: 20 },
  expertImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  expertName: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  expertComment: { color: '#F9FAFB', fontSize: 14, marginTop: 5 },
  searchContainer: {
    position: 'absolute',
    top: 700,
    left: 0,
    right: 0,
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 8,
  },
});

export default Affirmations;
