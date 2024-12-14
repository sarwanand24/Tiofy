import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { getAccessToken } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native-paper';

const FoodOrderHistory = () => {
  const [foodOrders, setFoodOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFoodOrders = async () => {
      try {
        setLoading(true);
        const token = await getAccessToken();
        const response = await axios.get('https://trioserver.onrender.com/api/v1/users/get-food-orderHistory', {
            headers: {
              'Authorization': `Bearer ${token}` // Add the token to the Authorization header
            }
          });
          const sortedOrders = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setFoodOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching food orders:', error);
      }
      finally{
        setLoading(false)
      }
    };

    fetchFoodOrders();
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
      <Text style={styles.orderText}>Restaurant: {item.restaurant[0]?.restaurantName}</Text>
      {item.items.map((food, index) => (
            <Text key={index} style={styles.orderText}>
              {food.name} : {food.quantity}
            </Text>
          ))}
      <Text style={styles.orderText}>Total Bill: Rs {item.bill}</Text>
      <Text style={styles.orderText}>Order Status: {item.orderStatus}</Text>
      <Text style={styles.orderText}>Ordered On: {new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
          <Text style={styles.title}>Food Order History</Text>
      {!foodOrders.length ? (
     <Text style={styles.title}>No Food Orders yet.</Text>
      ) :
      (
        <FlatList
        data={foodOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
      />
      )
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#68095f',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffff00',
    margin: 'auto',
    marginBottom: 10
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#68095f',
},
});

export default FoodOrderHistory;
