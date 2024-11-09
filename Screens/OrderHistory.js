import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OrderHistory = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order History</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => props.navigation.push('FoodOrderHistory')}
      >
        <Text style={styles.buttonText}>Food Order History</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => props.navigation.push('CabOrderHistory')}
      >
        <Text style={styles.buttonText}>Cab Booking History</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => props.navigation.push('HotelOrderHistory')}
      >
        <Text style={styles.buttonText}>Hotel Booking History</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8', // Snow white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    backgroundColor: '#FFF', // White button background
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 3, // Slight shadow effect for luxurious feel
  },
  buttonText: {
    fontSize: 18,
    color: '#333',
  },
});

export default OrderHistory;
