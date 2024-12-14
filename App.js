import React, { useRef } from 'react';
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
import FoodLoader from './Screens/FoodScreens/FoodLoader';
import FoodDashboard from './Screens/FoodScreens/FoodDashboard';
import Restaurant from './Screens/FoodScreens/Restaurant';
import FoodCart from './Screens/FoodScreens/FoodCart';
import MapDirection from './Screens/FoodScreens/MapDirection';
import FoodOrderHistory from './Screens/FoodScreens/FoodOrderHistory';
import CyrDashboard from './Screens/CYRScreens/CyrDashboard';
import CyrLoader from './Screens/CYRScreens/CyrLoader';
import HotelLoader from './Screens/HotelScreens/HotelLoader';
import CyrMapDirection from './Screens/CYRScreens/CyrMapDirection';
import HotelDashboard from './Screens/HotelScreens/HotelDashboard';
import Hotel from './Screens/HotelScreens/Hotel';
import CityNames from './Screens/HotelScreens/CityNames';
import Flat from './Screens/HotelScreens/Flat';
import HotelCart from './Screens/HotelScreens/HotelCart';
import HotelOrderHistory from './Screens/HotelScreens/HotelOrderHistory';
import HotelRatingSummary from './Screens/HotelScreens/HotelRatingSummary';
import LiquorDashboard from './Screens/LiquorScreens/LiquorDashboard';
import CyrOrderHistory from './Screens/CYRScreens/CyrOrderHistory';
import HelpSupportScreen from './Screens/HelpSupportScreen';
import UserProfile from './Screens/UserProfile';

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
        <Stack.Screen name="CyrDashboard" component={CyrDashboard} />
        <Stack.Screen name="LiquorDashboard" component={LiquorDashboard} />
        <Stack.Screen name="Restaurant" component={Restaurant} />
        <Stack.Screen name="FoodCart" component={FoodCart} />
        <Stack.Screen name="HotelCart" component={HotelCart} />
        <Stack.Screen name="FoodOrderHistory" component={FoodOrderHistory} />
        <Stack.Screen name="HotelOrderHistory" component={HotelOrderHistory} />
        <Stack.Screen name="CyrOrderHistory" component={CyrOrderHistory} />
        <Stack.Screen name="MapDirection" component={MapDirection} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Loading" component={Loading} />
        <Stack.Screen name="FoodLoader" component={FoodLoader} />
        <Stack.Screen name="CyrLoader" component={CyrLoader} />
        <Stack.Screen name="HotelLoader" component={HotelLoader} />
        <Stack.Screen name="CyrMapDirection" component={CyrMapDirection} />
        <Stack.Screen name="HotelDashboard" component={HotelDashboard} />
        <Stack.Screen name="Hotel" component={Hotel} />
        <Stack.Screen name="Flat" component={Flat} />
        <Stack.Screen name="CityNames" component={CityNames} />
        <Stack.Screen name="HotelRatingSummary" component={HotelRatingSummary} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
