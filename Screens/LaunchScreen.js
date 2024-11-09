import React, { useState, useEffect } from 'react';
import { View, Image, Dimensions, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';

const {width, height} = Dimensions.get('window');

function LaunchScreen(props) {
  const [locationEnabled, setLocationEnabled] = useState(false);

  const checkLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocationEnabled(true); // Location enabled
          },
          (error) => {
            console.log(error.code, error.message);
            Alert.alert(
              'Location Required',
              'Please enable location services to proceed.',
              [{ text: 'OK', onPress: checkLocationPermission }] // Re-prompt for location
            );
          },
          { timeout: 5000, maximumAge: 1000 }
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'Please grant location permission to proceed.',
          [{ text: 'OK', onPress: checkLocationPermission }] // Re-prompt for permission
        );
      }
    } catch (error) {
      console.warn(error);
    }
  };

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds
      
      if (locationEnabled) { // Proceed only if location is enabled
        if (token) {
          props.navigation.replace("MainApp");
        } else {
          props.navigation.replace("RegisterType");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkLocationPermission(); // Check for location permission
  }, []);

  useEffect(() => {
    if (locationEnabled) { // If location is enabled, check token and navigate
      fetchData();
    }
  }, [locationEnabled]); // Only run when location is enabled

  return (
    <View>
      <Image source={require('../assets/Logo/TiofyLogo.png')} style={{ width: width, height: height }} />
    </View>
  );
}

export default LaunchScreen;
