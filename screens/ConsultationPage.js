import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const ConsultationPage = () => {
  const navigation = useNavigation();

  const doctors = [
    {
      name: 'Dr. John Doe',
      image: require('../assets/doctor1.png'),
      role: 'Nutritionist',
      qualifications: 'MSc in Nutrition',
      experience: '5 years of experience in clinical nutrition and dietary planning.',
      workHistory: 'Worked with multiple health clinics and hospitals specializing in dietary management.',
    },
    {
      name: 'Dr. Jane Smith',
      image: require('../assets/doctor2.png'),
      role: 'Psychologist',
      qualifications: 'PhD in Psychology',
      experience: '7 years of experience in counseling and therapy.',
      workHistory: 'Expert in behavioral therapy and cognitive techniques, has worked in reputed mental health centers.',
    },
    {
      name: 'Dr. Emma Brown',
      image: require('../assets/doctor2.png'),
      role: 'Therapist',
      qualifications: 'Master’s in Clinical Therapy',
      experience: '8 years of experience in physical therapy.',
      workHistory: 'Specializes in musculoskeletal disorders and post-surgical rehabilitation.',
    },
  ];

  return (
    <LinearGradient colors={['#111827', '#1E293B']} style={styles.container}>
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
            <Text style={styles.welcomeText}>👨‍⚕️ Consult with Experts</Text>
          </View>

          {/* Doctors Info */}
          <Text style={styles.sectionTitle}>Choose an Expert</Text>
          {doctors.map((doctor, index) => (
            <View key={index} style={styles.doctorCard}>
              <Image source={doctor.image} style={styles.doctorImage} />
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorRole}>{doctor.role}</Text>

              {/* Details */}
              <View style={styles.detailsContainer}>
                <Text style={styles.label}>🎓 Qualifications:</Text>
                <Text style={styles.detailText}>{doctor.qualifications}</Text>

                <Text style={styles.label}>📅 Experience:</Text>
                <Text style={styles.detailText}>{doctor.experience}</Text>

                <Text style={styles.label}>🏥 Work History:</Text>
                <Text style={styles.detailText}>{doctor.workHistory}</Text>
              </View>

              <TouchableOpacity
                style={styles.consultButton}
                onPress={() => navigation.navigate('booking', { doctor: doctor })}
              >
                <LinearGradient colors={['#14B8A6', '#06B6D4']} style={styles.consultGradient}>
                  <Text style={styles.consultButtonText}>Book Consultation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        {[
          { icon: 'home-outline', label: 'Home', route: 'Dashboard' },
          { icon: 'chatbubble-outline', label: 'Chat', route: 'ChatbotScreen' },
          { icon: 'search-outline', label: 'Search' },
          { icon: 'calendar', label: 'Bookings', route: 'BookingScreen' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => (item.route ? navigation.navigate(item.route) : null)}
          >
            <Ionicons name={item.icon} size={22} color={'#9CA3AF'} />
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 15,
  },
  scrollContainer: {
    paddingBottom: 90,
  },
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 26,
    color: '#E2E8F0',
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    color: '#38BDF8',
    fontWeight: '700',
    marginVertical: 10,
    textAlign: 'center',
  },
  doctorCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  doctorImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
    marginBottom: 10,
    borderColor: '#38BDF8',
    borderWidth: 2,
  },
  doctorName: {
    fontSize: 20,
    color: '#F9FAFB',
    fontWeight: '700',
    textAlign: 'center',
  },
  doctorRole: {
    fontSize: 17,
    color: '#F9FAFB',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 5,
  },
  detailText: {
    fontSize: 15,
    color: '#E5E7EB',
    marginTop: 2,
  },
  consultButton: {
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 15,
  },
  consultGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderRadius: 10,
  },
  consultButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    paddingVertical: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
  },
});

export default ConsultationPage;
