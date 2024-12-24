import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const { height } = Dimensions.get('window');

const Cart = (props) => {
  const [cartData, setCartData] = useState(null);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('cartData');
        setCartData(jsonValue != null ? JSON.parse(jsonValue) : null);
      } catch (error) {
        console.log('Error fetching cart data:', error);
      }
    };

    fetchCartData();
  }, []);

  const handleProceedToCart = () => {
    if (cartData) {
      props.navigation.push("FoodCart", cartData);
    }
  };

  return (
    <View style={styles.container}>
         <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      {cartData ? (
        <ScrollView>
          <Text style={styles.title}>Cart Details</Text>
          <Text style={styles.itemText}>Restaurant: {cartData.restroName}</Text>
          <Text style={styles.itemText}>Total Items: {cartData.totalItem}</Text>
          <Text style={styles.itemText}>Total Amount: Rs {cartData.totalAmount}</Text>
          <Text style={styles.itemText}>Distance: {cartData.distance} km</Text>

          <Text style={styles.subtitle}>Selected Foods:</Text>
          {cartData.selectedFoods.map((food, index) => (
            <Text key={index} style={styles.foodItemText}>
              {food.name} : {food.quantity}
            </Text>
          ))}

          <TouchableOpacity style={styles.cartBtn} onPress={handleProceedToCart}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Proceed to Cart
              <Icon name="arrow-right" size={15} color="white" />
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68095f',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ffff00',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: 'white',
  },
  itemText: {
    fontSize: 18,
    marginBottom: 8,
    color: 'white',
  },
  foodItemText: {
    fontSize: 16,
    marginBottom: 6,
    color: 'white',
  },
  cartBtn: {
    backgroundColor: '#9f0d91',
    padding: 15,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: 'white',
  },
});

export default Cart;
