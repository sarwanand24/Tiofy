import React, { useState } from 'react';
import { BottomNavigation, Text } from 'react-native-paper';
import TiofyDashboard from './TiofyDashboard'; // Assuming this is the component we are working on
import OrderHistory from './OrderHistory';
import Cart from './Cart';
import Account from './Account';

const MainApp = (props) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'orders', title: 'Orders', focusedIcon: 'clipboard-text-outline', unfocusedIcon: 'clipboard-text' },
    { key: 'cart', title: 'Cart', focusedIcon: 'cart', unfocusedIcon: 'cart-outline' },
    { key: 'account', title: 'Account', focusedIcon: 'account', unfocusedIcon: 'account-circle-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: () => <TiofyDashboard {...props} />,
    orders: () => <OrderHistory {...props} />,
    cart: () => <Cart {...props} />,
    account: () => <Account {...props} />,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#5ecdf9', height: 50 }}
      activeColor='lightpink'
      inactiveColor='white'
    />
  );
};

export default MainApp;
