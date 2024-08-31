import React from 'react';
import {
  Dimensions
} from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

//Screens
import LaunchScreen from './Screens/LaunchScreen';
import RegisterType from './Screens/Authentication/RegisterType';
import Login from './Screens/Authentication/Login';
import Signup from './Screens/Authentication/Signup';
import TiofyDashboard from './Screens/TiofyDashboard';
import MainApp from './Screens/BottomNavigation';
import Loading from './Screens/Loading';
import FoodDashboard from './Screens/FoodScreens/FoodDashboard';
import Restaurant from './Screens/FoodScreens/Restaurant';
import FoodCart from './Screens/FoodScreens/FoodCart';
import MapDirection from './Screens/FoodScreens/MapDirection';
import FoodOrderHistory from './Screens/FoodScreens/FoodOrderHistory';

const Stack = createNativeStackNavigator();

const App = () => {

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LaunchScreen"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="LaunchScreen" component={LaunchScreen} />
        <Stack.Screen name="RegisterType" component={RegisterType} />
        <Stack.Screen name="MainApp" component={MainApp} />
        <Stack.Screen name="FoodDashboard" component={FoodDashboard} />
        <Stack.Screen name="Restaurant" component={Restaurant} />
        <Stack.Screen name="FoodCart" component={FoodCart} />
        <Stack.Screen name="FoodOrderHistory" component={FoodOrderHistory} />
        <Stack.Screen name="MapDirection" component={MapDirection} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Loading" component={Loading} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
