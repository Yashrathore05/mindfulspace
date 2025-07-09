import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../services/firebaseConfig'; // Direct import of firestore

const ConsultationDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const doctor = route.params?.doctor;

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubmit = async () => {
    if (!patientName || !patientAge || !reason) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true); // Start loading

    try {
      await addDoc(collection(firestore, 'consultations'), {
        doctorName: doctor?.name,
        doctorRole: doctor?.role,
        doctorQualifications: doctor?.qualifications,
        patientName,
        patientAge,
        reason,
        timestamp: new Date(),
      });

      Alert.alert('Success', 'Consultation booked successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setLoading(false); // Stop loading before navigation
            navigation.navigate('ConsultationPage');
          },
        },
      ]);
    } catch (error) {
      setLoading(false); // Stop loading on error
      Alert.alert('Error', 'Failed to book consultation');
      console.error('Error adding document: ', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Consultation Details</Text>

      {/* Doctor Details (Auto-filled) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Doctor's Name</Text>
        <TextInput style={styles.input} value={doctor?.name} editable={false} />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Role</Text>
        <TextInput style={styles.input} value={doctor?.role} editable={false} />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Qualifications</Text>
        <TextInput style={styles.input} value={doctor?.qualifications} editable={false} />
      </View>

      {/* Patient Details */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Patient Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#A1A1A1"
          value={patientName}
          onChangeText={setPatientName}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Patient Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your age"
          keyboardType="numeric"
          placeholderTextColor="#A1A1A1"
          value={patientAge}
          onChangeText={setPatientAge}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Reason for Consultation</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter reason"
          multiline={true}
          placeholderTextColor="#A1A1A1"
          value={reason}
          onChangeText={setReason}
        />
      </View>

      {/* Submit Button with Loading Indicator */}
      <TouchableOpacity
        style={[styles.submitButton, loading && { backgroundColor: '#999' }]} // Disable button when loading
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" /> // Show spinner when loading
        ) : (
          <Text style={styles.submitButtonText}>Book Consultation</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#0F172A' },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 20, color: '#22D3EE', textAlign: 'center' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 16, color: '#CBD5E1', fontWeight: '600', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#22D3EE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', textTransform: 'uppercase' },
});

export default ConsultationDetails;
