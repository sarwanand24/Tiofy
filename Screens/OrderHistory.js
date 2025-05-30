import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';

const OrderHistory = (props) => {
  return (
    <View style={styles.container}>
         <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      <Text style={styles.title}>Order History</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => props.navigation.push('FoodOrderHistory')}
      >
        <Text style={styles.buttonText}>Food Order History</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => props.navigation.push('CyrOrderHistory')}
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
    backgroundColor: '#68095f', // Snow white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#ffff00',
  },
  button: {
    backgroundColor: '#9f0d91', // White button background
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
    color: 'white',
  },
});

export default OrderHistory;
