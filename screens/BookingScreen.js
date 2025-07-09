import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebaseConfig';
import QRCode from 'react-native-qrcode-svg';

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'consultations'));
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id, // Firestore unique ID
          ...doc.data(),
        }));
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.doctorName}>Doctor: {item.doctorName}</Text>
            <Text style={styles.details}>Role: {item.doctorRole}</Text>
            <Text style={styles.details}>Qualifications: {item.doctorQualifications}</Text>
            <Text style={styles.details}>Patient: {item.patientName} (Age: {item.patientAge})</Text>
            <Text style={styles.details}>Reason: {item.reason}</Text>
            <Text style={styles.timestamp}>
              Date: {new Date(item.timestamp.toDate()).toLocaleString()}
            </Text>

            {/* QR Code for Verification */}
            <View style={styles.qrContainer}>
              <QRCode value={`https://mw-var3.vercel.app/verify.html?id=BOOKING_ID`} size={100} />
              <Text style={styles.qrText}>Scan to Verify</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0F172A' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#22D3EE', textAlign: 'center', marginBottom: 15, marginTop:40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#1E293B',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#22D3EE',
    alignItems: 'center',
  },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  details: { fontSize: 16, color: '#CBD5E1', marginTop: 2 },
  timestamp: { fontSize: 12, color: '#A1A1A1', marginTop: 5 },
  qrContainer: { alignItems: 'center', marginTop: 10 },
  qrText: { fontSize: 14, color: '#A1A1A1', marginTop: 5 },
});

export default BookingsList;
