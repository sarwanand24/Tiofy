import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getAccessToken } from '../../utils/auth';
import axios from 'axios';
import { ActivityIndicator } from 'react-native-paper';

const CyrOrderHistory = () => {
  const [CyrOrders, setCyrOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCyrOrders = async () => {
      try {
        setLoading(true);
        const token = await getAccessToken();
        const response = await axios.get('https://trioserver.onrender.com/api/v1/users/cyr-order-history', {
            headers: {
              'Authorization': `Bearer ${token}` // Add the token to the Authorization header
            }
          });
          const sortedOrders = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setCyrOrders(sortedOrders);
          console.log('rider data cyr-->', sortedOrders)
      } catch (error) {
        console.error('Error fetching food orders:', error);
      }finally{setLoading(false)}
    };

    fetchCyrOrders();
  }, []);

  if (loading) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="white" />
        </View>
    ); // Show an ActivityIndicator while loading
}

  const renderOrder = ({ item }) => (
    <View style={styles.orderContainer}>
      <Text style={styles.orderText}>OrderId: {item._id}</Text>
      <Text style={styles.orderText}>Rider: {item.rider[0]?.riderName}</Text>
      <Text style={styles.orderText}>Contact: {item.rider[0]?.mobileNo}</Text>
      <Text style={styles.orderText}>From: {item.fromLocation.placeName}, {item.fromLocation.city}</Text>
      <Text style={styles.orderText}>To: {item.toLocation.placeName}, {item.toLocation.city}</Text>
      <Text style={styles.orderText}>Distance: {item.distance} km</Text>
      <Text style={styles.orderText}>Total Bill: Rs {item.bill}</Text>
      <Text style={styles.orderText}>Ride Status: {item.rideStatus}</Text>
      <Text style={styles.orderText}>Ordered On: {new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cyr Order History</Text>
      {!CyrOrders.length ? (
        <Text style={styles.title}>No CYR Orders yet.</Text>
      ) : (
        <FlatList
          data={CyrOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item._id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#68095f',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#68095f',
},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ffff00',
  },
  orderContainer: {
    padding: 16,
    backgroundColor: '#9f0d91',
    borderRadius: 10,
    marginBottom: 16,
    elevation: 3,
  },
  orderText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
});

export default CyrOrderHistory;
