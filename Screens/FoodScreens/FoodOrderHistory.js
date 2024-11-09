import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { getAccessToken } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FoodOrderHistory = () => {
  const [foodOrders, setFoodOrders] = useState([]);

  useEffect(() => {
    const fetchFoodOrders = async () => {
      try {
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
    };

    fetchFoodOrders();
  }, []);

  const renderOrder = ({ item }) => (
    <View style={styles.orderContainer}>
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
      <FlatList
        data={foodOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  orderContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 16,
    elevation: 3,
  },
  orderText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
});

export default FoodOrderHistory;
