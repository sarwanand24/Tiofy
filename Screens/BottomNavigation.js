import React, { useState } from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import TiofyDashboard from './TiofyDashboard'; // Assuming this is the component we are working on

const Orders = () => <Text>Orders</Text>;
const Cart = () => <Text>Cart</Text>;
const Account = () => <Text>Account</Text>;

const MainApp = (props) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'orders', title: 'Orders', focusedIcon: 'list', unfocusedIcon: 'list-outline' },
    { key: 'cart', title: 'Cart', focusedIcon: 'cart', unfocusedIcon: 'cart-outline' },
    { key: 'account', title: 'Account', focusedIcon: 'contact', unfocusedIcon: 'user-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: () => <TiofyDashboard {...props} />,
    orders: () => <Orders {...props} />,
    cart: () => <Cart {...props} />,
    account: () => <Account {...props} />,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#6299FF' }}
      activeColor='pink'
      inactiveColor='white'
    />
  );
};

export default MainApp;
