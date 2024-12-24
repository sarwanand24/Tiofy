import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Animated, TextInput, Image, StyleSheet, Alert, PermissionsAndroid, Platform,
  Dimensions, TouchableOpacity, FlatList,
  ScrollView, Easing
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/FontAwesome6';
import LottieView from 'lottie-react-native';
import socket from '../../utils/Socket';
import CyrLoader from './CyrLoader';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import RiderSearchLoader from './RiderSearchLoader';

const { width, height } = Dimensions.get('window');

const GOOGLE_API_KEY = 'AIzaSyCEaITG1Dzxu2l4rrNzABJ3aU-9tbBrZRk';

const CyrDashboard = (props) => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [permissionScreen, setPermissionScreen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [ridesData, setRidesData] = useState([]);
  const slideAnim = useRef(new Animated.Value(200)).current;
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const slideUpAnim = useRef(new Animated.Value(600)).current;
  const [offersData, setOffersData] = useState([]);
  const [headerText, setHeaderText] = useState('');
  const pickupInputRef = useRef(null);
  const dropInputRef = useRef(null);
  const [isSearchLoad, setIsSearchLoad] = useState(false);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [arrivalTime, setArrivalTime] = useState('');
  const [undeliveredOrders, setUndeliveredOrders] = useState([]);
  const [deliveryFeeBike, setDeliveryFeeBike] = useState(10.5);
  const [deliveryFeeCar, setDeliveryFeeCar] = useState(20.5);
  const [deliveryFeeToto, setDeliveryFeeToto] = useState(15.5);
  const [hiddenOrders, setHiddenOrders] = useState([]);
  const [riderSearch, setRiderSearch] = useState(false);
  const [noRidersFound, setNoRidersFound] = useState(false);

  const onMapLayout = () => {
    setMapReady(true);
  };

  const scrollViewRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  const animation = useRef(new Animated.Value(0)).current;

  // Request location permissions
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      return true;
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, [])

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setPermissionScreen(false);
      setManualEntry(false);
      setLoading(true); // Start loading here
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setManualEntry(false)
        setPermissionScreen(true);
        setLoading(false); // Stop loading if permission is not granted
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(latitude, longitude);
          matchLocation(latitude, longitude); // Call matchLocation without updating loading here
        },
        (error) => {
          setPermissionScreen(true);
          setLoading(false); // Stop loading if location fetch fails
          Alert.alert('Error', 'Unable to fetch location');
        },
        { enableHighAccuracy: true, timeout: 50000, maximumAge: 1000000 }
      );
    } catch (error) {
      console.log('Error in getCurrentLocation function');
      setLoading(false); // Stop loading if there is an error in the try block
    }
  };

  const matchLocation = async (lat, long) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_API_KEY}`
      );

      console.log('Response:', response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Data:', data);

      if (data.results && data.results.length > 0) {
        // Extract address components
        const addressComponents = data.results[0].address_components;
        const city = addressComponents.find(comp => comp.types.includes('locality'))?.long_name || 'N/A';
        const state = addressComponents.find(comp => comp.types.includes('administrative_area_level_1'))?.long_name || 'N/A';
        const country = addressComponents.find(comp => comp.types.includes('country'))?.long_name || 'N/A';
        const pincode = addressComponents.find((component) => component.types.includes('postal_code'))?.long_name || 'N/A';
        // Full address and display name
        const fullAddress = `${city}, ${state}, ${country}`;
        const formattedAddress = data.results[0].formatted_address;
        const placename = formattedAddress.split(', ').slice(1).join(', ');
        setPermissionScreen(false);
        setPickupLocation({ lat, long, placeName: placename, city: fullAddress, pincode });
        console.log('pickupLocation set successs.....')
      } else {
        setPermissionScreen(false);
        setShowNotification(true);
        Animated.spring(slideAnim, {
          toValue: 0, // Slide to the center of the screen
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.log('Error in matchLocation')
    } finally { setLoading(false) }
  };

  // Handle manual entry
  const handleManualEntry = () => {
    setPermissionScreen(false);
    setManualEntry(true);
  };

  if (permissionScreen) {
    return (
      <View style={styles.container}>
        <LottieView source={require('../../assets/Animations/location.json')}
          style={styles.lottie} autoPlay loop />

        <Text style={styles.permissionText}>
          Location permission not enabled
        </Text>
        <Text style={styles.noteText}>
          Sharing location permission helps us improve your ride booking and pickup experience.
        </Text>

        <View>
          <TouchableOpacity
            onPress={getCurrentLocation}
            style={{ backgroundColor: '#ffda00', padding: 15, borderRadius: 10 }}>
            <Text style={{ color: 'black', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>Allow Location Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleManualEntry}
            style={{ width: width - 60, backgroundColor: 'white', padding: 15, borderRadius: 10, borderColor: 'black', borderWidth: 1, marginTop: 15 }}>
            <Text style={{ color: 'black', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>Enter Location manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  useEffect(() => {
    const fetchUndeliveredOrders = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        const response = await axios.get('https://trioserver.onrender.com/api/v1/cyrOrder/getUserUndeliveredOrders', {
          headers: {
            'Authorization': `Bearer ${token}` // Add the token to the Authorization header
          }
        }); // Adjust the endpoint as needed
        console.log('responseeoooo', response.data);
        setUndeliveredOrders(response.data);
      } catch (error) {
        console.log('Error fetching undelivered orders:', error);
      }
    };

    fetchUndeliveredOrders();
  }, []);

  const handleHideOrder = (orderId) => {
    setHiddenOrders((prev) => [...prev, orderId]); // Add the order ID to the hidden list
  };

  useEffect(() => {
    if (isSearchLoad) {
      startLoadingAnimation();
    } else {
      animation.stopAnimation();
      animation.setValue(0);
    }
  }, [isSearchLoad]);

  const startLoadingAnimation = () => {
    animation.setValue(0);
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  };

  const animatedWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    // Check if both pickupLocation and dropLocation are set
    console.log(`PIckup&DroplOcation:...........`, pickupLocation, `:::`, dropLocation)
    if (
      pickupLocation && dropLocation &&
      pickupLocation.lat && pickupLocation.long && pickupLocation.placeName &&
      dropLocation.lat && dropLocation.long && dropLocation.placeName
    ) {
      fetchRoute(); // Call fetchRoute when both locations are defined
    }
  }, [pickupLocation, dropLocation]);

  const fetchRoute = async () => {
    try {
      setIsSearchLoad(true)
      const response1 = await fetch('https://trioserver.onrender.com/api/v1/users/rides-available', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pickupLocation })
      });

      if (response1.ok) {
        const data = await response1.json();
        console.log('Rides Available Data', data[0], data[1]);
        setRidesData(data) // Process or display the categorized riders
      } else {
        setManualEntry(false);
        setShowNotification(true);
        console.error('Error fetching riders:', response1.statusText); //show we don't operate in your area
      }
      setIsSearchLoad(false)
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${pickupLocation.long},${pickupLocation.lat};${dropLocation.long},${dropLocation.lat}?overview=full`);
      const data = await response.json();
      const encodedPolyline = data.routes[0].geometry;
      const distance = data.routes[0].distance;
      const duration = data.routes[0].duration;

      const response2 = await fetch('https://trioserver.onrender.com/api/v1/users/get-all-fees');
      const data2 = await response2.json();

      setDeliveryFeeBike(data2?.deliveryFeeBike || 10.5)
      setDeliveryFeeCar(data2?.deliveryFeeCar || 20.5)
      setDeliveryFeeToto(data2?.deliveryFeeToto || 15.5)

      setRouteDistance(distance);
      setRouteDuration(duration);

      const coordinates = polyline.decode(encodedPolyline).map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));

      setRouteCoordinates(coordinates);
    } catch (error) {
      console.log('Error fetching route Rani:', error);
    }
  };

  useEffect(() => {
    if (ridesData?.length) {
      console.log('check1', ridesData)
      Animated.timing(slideUpAnim, {
        toValue: height - 50,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [ridesData])

  useEffect(() => {
    setSelectedVehicleType(ridesData.length > 0 ? ridesData[0].vehicleType : null)
  }, [ridesData])

  const handleVehicleSelect = (vehicleType) => {
    setSelectedVehicleType(vehicleType); // Set selected vehicle type
  };

  useEffect(() => {
    const fetchOffersData = async () => {
      try {
        const response = await axios.get('https://trioserver.onrender.com/api/v1/users/cyr-offer-images');
        setOffersData(response.data);
      } catch (error) {
        console.log('Error fetching offers data', error);
      }
    };

    fetchOffersData();
  }, []);

  useEffect(() => {
    if (offersData.length > 0) {
      let currentIndex = 0;

      scrollIntervalRef.current = setInterval(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: currentIndex * 200, // Adjust based on offer item width
            animated: true,
          });

          currentIndex += 1;
          if (currentIndex >= offersData.length) {
            currentIndex = 0;
          }
        }
      }, 2500); // Auto-scroll every 3 seconds

      return () => clearInterval(scrollIntervalRef.current); // Clean up the interval on component unmount
    }
  }, [offersData]);

  const handleBookRide = async () => {
    // Check if the response contains multiple vehicle types
    setManualEntry(false);
    setLoading(false);// show rider search here
    setRiderSearch(true)

    const selectedCategory = ridesData.find(category => category.vehicleType === selectedVehicleType);

    if (selectedCategory) {
      // Filter riders based on the selected vehicle type
      const filteredRiders = selectedCategory.riders; // Directly access riders for the selected vehicle type
      console.log('Filtered Riders:', filteredRiders);
      const userDeviceToken = await AsyncStorage.getItem("deviceToken")
      const StringUserdata = await AsyncStorage.getItem("Userdata")
      const Userdata = JSON.parse(StringUserdata);
      console.log("Userdata", Userdata);
      console.log("UserdataAddress", Userdata.address, Userdata._id);
      console.log("SocketId", socket.id);
      const otp = Math.floor(1000 + Math.random() * 9000);
      console.log(`Generated OTP: ${otp}`);
      const bill = (Math.ceil(routeDistance / 1000) * (selectedVehicleType == 'Bike' ? (deliveryFeeBike) : selectedVehicleType == 'Toto' ? (deliveryFeeToto) : (deliveryFeeCar)));// make it autometa
      socket.emit("CyrRidePlaced", { riders: filteredRiders, userDeviceToken, otp, Userdata, socketId: socket.id, bill, pickupLocation, dropLocation, selectedVehicleType })
      // Here you can proceed with the booking logic using filteredRiders
    } else {
      // Handle case where the selected vehicle type doesn't match any category
      console.warn('No riders available for this vehicle type.');
      setRiderSearch(false);
    }
  };

  useEffect(() => {
    const handleOrderAccepted = async (data) => {
      try {
        // Fetch user data from AsyncStorage
        const StringUserdata = await AsyncStorage.getItem("Userdata");
        const Userdata = JSON.parse(StringUserdata);

        // Check if the order is for the current user
        if (data.userId === Userdata._id) {
          // Navigate to the MapDirection screen
          setRiderSearch(false);
          props.navigation.push("CyrMapDirection", {
            orderId: data.orderId,
            socket,
            userId: Userdata._id
          });
        }
      } catch (error) {
        console.log("Error handling order accepted event: ", error);
      }
    };

    // Set up the socket listener
    socket.on("CyrRideAcceptedbyRider", handleOrderAccepted);

    // Cleanup the socket listener when the component unmounts
    return () => {
      socket.off("CyrRideAcceptedbyRider", handleOrderAccepted);
    };
  }, [socket]);

  useEffect(() => {
    socket.on("NoRiderFoundForCYR", async (data) => {
        const StringUserdata = await AsyncStorage.getItem("Userdata");
        const Userdata = JSON.parse(StringUserdata);
        if (data.userId === Userdata._id) {
          console.log('NO rider found screen --------')
            setRiderSearch(false);
            setNoRidersFound(true); // Show "No Riders Found" UI
        }
    });

    return () => {
        socket.off("NoRiderFoundForCYR");
    };
}, [socket]);

  useEffect(() => {
    if (manualEntry) {
      // Focus on the empty TextInput
      console.log('enrty in reffffffffffff')
      if (!pickupLocation?.placeName) {
        pickupInputRef.current?.focus();
        setHeaderText('Pickup');
      } else if (!dropLocation?.placeName) {
        console.log('enrty in reffffffffffff 22222')
        pickupInputRef.current.setAddressText(pickupLocation.placeName);
        dropInputRef.current?.focus();
        setHeaderText('Drop');
      }
    }
  }, [manualEntry]);

  const handleLocationFocus = (isPickup) => {
    console.log('Entry in handleFocus Functiuon....')
    setHeaderText(isPickup ? 'Pickup' : 'Drop');
  };

  // useEffect(() => {
  //   const calculateArrivalTime = () => {
  //     const currentTime = new Date();
  //     console.log('curretTime before:', currentTime)
  //     currentTime.setMinutes(currentTime.getMinutes() + (routeDuration / 60));
  //     // Format the time (hh:mm AM/PM)
  //     const hours = currentTime.getHours();
  //     const minutes = currentTime.getMinutes();
  //     const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  //     console.log('LogOfAll', routeDuration, currentTime, hours, minutes, formattedTime, routeDistance)
  //     setArrivalTime(formattedTime);
  //   };

  //   calculateArrivalTime();
  // }, [routeDuration]);

  if (manualEntry) {
    // Only show pickup and drop inputs if location is granted or manual entry is chosen
    return (
      <View style={styles.inputContainer}>

        {!ridesData.length && (
          <View>
            <TouchableOpacity onPress={() => setManualEntry(false)} style={styles.headerContainer}>
              <Icon name="arrow-left" size={23} color="#000" style={{ padding: 10 }} />
              <Text style={styles.headerText}>{headerText}</Text>
            </TouchableOpacity>

            {/* Pickup Input */}
            <View style={styles.locInputContainer}>
              <View style={styles.locInputContainer2}>
                <Icon name="circle-dot" size={15} color="green" />

                <GooglePlacesAutocomplete
                  ref={pickupInputRef}
                  placeholder='Pickup Location'
                  fetchDetails={true}
                  onPress={(data, details = null) => {
                    console.log('Log of autocomplete:', details);
                    if (details) {
                      const addressComponents = details.address_components;

                      // Extract city, state, and country
                      const city = addressComponents.find((component) =>
                        component.types.includes('locality')
                      )?.long_name || 'N/A';

                      const state = addressComponents.find((component) =>
                        component.types.includes('administrative_area_level_1')
                      )?.long_name || 'N/A';

                      const country = addressComponents.find((component) =>
                        component.types.includes('country')
                      )?.long_name || 'N/A';

                      // Set the pickup location
                      setPickupLocation({
                        lat: details.geometry.location.lat,
                        long: details.geometry.location.lng,
                        placeName: data.description,
                        city: `${city}, ${state}, ${country}`, // Format as required
                        pincode: addressComponents.find((component) =>
                          component.types.includes('postal_code')
                        )?.long_name || 'N/A',
                      });
                    }
                  }}
                  query={{
                    key: GOOGLE_API_KEY,  // Your Google API Key here
                    language: 'en',
                  }}
                  textInputProps={{
                    onFocus: () => handleLocationFocus(true),
                    placeholderTextColor: 'black', // Attach the onFocus handler here
                  }}
                  suppressDefaultStyles={true}
                  styles={{
                    container: {
                      flex: 1,
                    },
                    textInputContainer: {
                      flexDirection: 'row',
                    },
                    textInput: {
                      backgroundColor: '#eeeeee',
                      color: 'black',
                      height: 44,
                      borderRadius: 5,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      fontSize: 15,
                      flex: 1,
                    },
                    poweredContainer: {
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      borderBottomRightRadius: 5,
                      borderBottomLeftRadius: 5,
                      borderColor: '#c8c7cc',
                      borderTopWidth: 0.5,
                    },
                    powered: {},
                    listView: {
                      color: 'black'
                    },
                    row: {
                      backgroundColor: '#eeeeee',
                      color: 'black',
                      padding: 13,
                      height: 44,
                      flexDirection: 'row',
                    },
                    separator: {
                      height: 0.5,
                      backgroundColor: '#c8c7cc',
                    },
                    description: {
                      color: 'black'
                    },
                    loader: {
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      height: 20,
                    },
                  }}
                />

              </View>

              <View style={styles.horizontalLine} />

              {/* Drop Input */}
              <View style={styles.locInputContainer2}>
                <Icon name="circle-dot" size={15} color="red" />
                <GooglePlacesAutocomplete
                  ref={dropInputRef}
                  placeholder='Drop Location'
                  fetchDetails={true}
                  onPress={(data, details = null) => {
                    console.log('Log of autocomplete:', details);
                    if (details) {
                      const addressComponents = details.address_components;

                      // Extract city, state, and country
                      const city = addressComponents.find((component) =>
                        component.types.includes('locality')
                      )?.long_name || 'N/A';

                      const state = addressComponents.find((component) =>
                        component.types.includes('administrative_area_level_1')
                      )?.long_name || 'N/A';

                      const country = addressComponents.find((component) =>
                        component.types.includes('country')
                      )?.long_name || 'N/A';

                      // Set the pickup location
                      setDropLocation({
                        lat: details.geometry.location.lat,
                        long: details.geometry.location.lng,
                        placeName: data.description,
                        city: `${city}, ${state}, ${country}`, // Format as required
                        pincode: addressComponents.find((component) =>
                          component.types.includes('postal_code')
                        )?.long_name || 'N/A',
                      });
                    }
                  }}
                  query={{
                    key: GOOGLE_API_KEY,  // Your Google API Key here
                    language: 'en',
                  }}
                  textInputProps={{
                    onFocus: () => handleLocationFocus(false),
                    placeholderTextColor: 'black', // Attach the onFocus handler here
                  }}
                  suppressDefaultStyles={true}
                  styles={{
                    container: {
                      flex: 1,
                    },
                    textInputContainer: {
                      flexDirection: 'row',
                    },
                    textInput: {
                      backgroundColor: '#eeeeee',
                      color: 'black',
                      height: 44,
                      borderRadius: 5,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      fontSize: 15,
                      flex: 1,
                    },
                    poweredContainer: {
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      borderBottomRightRadius: 5,
                      borderBottomLeftRadius: 5,
                      borderColor: '#c8c7cc',
                      borderTopWidth: 0.5,
                    },
                    powered: {},
                    listView: {
                      color: 'black'
                    },
                    row: {
                      backgroundColor: '#eeeeee',
                      color: 'black',
                      padding: 13,
                      height: 44,
                      flexDirection: 'row',
                    },
                    separator: {
                      height: 0.5,
                      backgroundColor: '#c8c7cc',
                    },
                    description: {
                      color: 'black'
                    },
                    loader: {
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      height: 20,
                    },
                  }}
                />
              </View>
            </View>

            <View style={styles.horizontalLine2} >
              <Animated.View style={[styles.blueLine, { width: animatedWidth }]} />
            </View>
          </View>
        )}

        {ridesData.length > 0 && pickupLocation && dropLocation && (
          <View>
            <TouchableOpacity onPress={() => {
              setManualEntry(false);
              setRidesData([]);
              setDropLocation(null);
            }} style={styles.headerContainer2}>
              <Icon name="arrow-left" size={23} color="#000" style={{ padding: 10 }} />
            </TouchableOpacity>
            <MapView
              ref={mapRef}
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              onLayout={onMapLayout}
              region={{
                latitude: pickupLocation.lat,
                longitude: pickupLocation.long,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              customMapStyle={[]}
              tileOverlay={{
                urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                maximumZ: 19,
              }}
            >
              {mapReady && (
                <>
                  <Marker
                    coordinate={{
                      latitude: pickupLocation.lat,
                      longitude: pickupLocation.long,
                    }}
                    title="User"
                    description="User Location"
                  >
                    <Image source={require('../../assets/person.png')} style={styles.markerImage} />
                  </Marker>

                  <Marker
                    coordinate={{
                      latitude: dropLocation.lat,
                      longitude: dropLocation.long,
                    }}
                    title="Rider"
                    description="Rider Location"
                  >
                    <Image source={require('../../assets/location.webp')} style={styles.markerImage} />
                  </Marker>

                  {routeCoordinates.length > 0 && (
                    <Polyline
                      coordinates={routeCoordinates}
                      strokeColor="#68095f"
                      strokeWidth={3}
                    />
                  )}
                </>
              )}
            </MapView>
            <Animated.View style={[styles.vehicleContainer, { transform: [{ translateY: slideUpAnim }] }]}>
              <Text style={styles.categoryHeading}>Choose Vehicle</Text>
              <View style={styles.vehicleList}>
                {ridesData.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.vehicleType}
                    style={[
                      styles.vehicleOption,
                      selectedVehicleType === vehicle.vehicleType && styles.activeVehicleOption,
                    ]}
                    onPress={() => handleVehicleSelect(vehicle.vehicleType)}
                  >
                    <View style={styles.vehicleInfo}>
                      {vehicle.vehicleType === 'Bike' ? (
                        <Image source={require('../../assets/cyrBike.png')} style={styles.markerImage} />
                      ) : vehicle.vehicleType === 'Toto' ? (
                        <Image source={require('../../assets/cyrToto.jpeg')} style={styles.markerImage} />
                      ) : (
                        <Image source={require('../../assets/cyrCab.png')} style={styles.markerImage} />
                      )}
                      <View>
                        <Text
                          style={[
                            styles.vehicleText,
                            { marginLeft: 10, fontSize: 16, fontWeight: '700' }
                          ]}
                        >
                          {vehicle.vehicleType}
                        </Text>
                        <Text
                          style={[
                            styles.vehicleText,
                            { marginLeft: 10, fontSize: 12 }
                          ]}
                        >
                          {Math.ceil(routeDuration/60)} mins
                        </Text>
                      </View>
                    </View>
                   <View>
                   <Text
                      style={[
                        styles.vehicleText,
                        { marginLeft: 10, fontSize: 16, fontWeight: '700' }
                      ]}
                    >
                      Rs{vehicle.vehicleType == 'Bike' ? (Math.ceil(Math.ceil(routeDistance / 1000) * deliveryFeeBike)) : vehicle.vehicleType == 'Toto' ? (Math.ceil(Math.ceil(routeDistance / 1000) * deliveryFeeToto)) : (Math.ceil(Math.ceil(routeDistance / 1000) * deliveryFeeCar))}
                    </Text>
                    <Text
                          style={[
                            styles.vehicleText,
                            { marginLeft: 15, fontSize: 12 }
                          ]}
                        >
                         {Math.ceil(routeDistance / 1000)}Km
                        </Text>
                   </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.bookButton} onPress={handleBookRide}>
                <Text style={styles.bookButtonText}>Book {selectedVehicleType}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

      </View>
    );
  }

  if (loading) {
    return (
      <CyrLoader />
    );
  }

  if (riderSearch) {
    return <RiderSearchLoader />;
}

if (noRidersFound) {
  return (
      <View style={styles.restroContainer}>
          <Text style={styles.messageText}>
              Sorry! We are unable to find any riders for you at the moment!
          </Text>
          <Text style={styles.subMessageText}>
              Please try again after sometimes.
          </Text>
          <LottieView
              source={require('../../assets/Animations/RestroRejected.json')}
              style={styles.lottie}
              autoPlay
              loop
          />
          <TouchableOpacity
              style={styles.resbutton}
              onPress={() => {
                  setNoRidersFound(false); // Close the "No Riders Found" UI
                  props.navigation.pop(2);
              }}
          >
              <Text style={styles.resbuttonText}>Go Back!</Text>
          </TouchableOpacity>
      </View>
  );
}

  return (
    <ScrollView style={styles.searchScreenContainer}>

      <View style={{ padding: 20 }}>
        <TouchableOpacity style={styles.searchBar} onPress={() => setManualEntry(true)}>
          <Icon
            name="magnifying-glass"
            size={20}
            color="black"
          />
          <Text style={styles.searchPlaceholder}>Where are you going?</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingLeft: 20, paddingRight: 20 }}>
        <Text style={styles.exploreHeading}>Explore</Text>
        <View style={styles.iconsContainer}>
          <TouchableOpacity onPress={() => setManualEntry(true)}>
            <View style={{ backgroundColor: '#f5f4f5', padding: 8, borderRadius: 20 }}>
              <Image source={require('../../assets/cyrBike.png')} style={styles.icon} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: '700' }}>Bike</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setManualEntry(true)}>
            <View style={{ backgroundColor: '#f5f4f5', padding: 8, borderRadius: 20 }}>
              <Image source={require('../../assets/cyrCab.png')} style={styles.icon} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: '700' }}>Cab</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setManualEntry(true)}>
            <View style={{ backgroundColor: '#f5f4f5', padding: 8, borderRadius: 20 }}>
              <Image source={require('../../assets/cyrToto.jpeg')} style={styles.icon} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: '700' }}>Toto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Discounts & Offers */}
      {
        offersData.length > 0 && (
          <>
            <Text style={styles.offersTitle}>Discounts & Offers</Text>
            <View style={styles.offersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.offersScrollContainer}
                ref={scrollViewRef}
              >
                {offersData.map((offer, index) => {
                  // Replace 'http://' with 'https://' in the image URL
                  const secureImageUrl = offer.imageUrl.replace("http://", "https://");

                  return (
                    <View key={index} style={styles.offerItem}>
                      <Image
                        source={{ uri: secureImageUrl }} // Use the secure HTTPS URL
                        style={styles.offerImage}
                        resizeMode="cover"
                      />
                      {/* <Text style={styles.offerText}>{offer.title}</Text> */}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </>
        )
      }

      <Image source={require('../../assets/CyrBottom.png')} style={styles.bottomImage} />

      {showNotification && (
        <>
          {/* Background overlay for dimming */}
          <View style={styles.dimBackground} />

          {/* Sliding notification */}
          <Animated.View
            style={[
              styles.notificationContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.notificationText}>We don't serve in your area.</Text>
            <Image source={require('../../assets/person.png')} style={styles.notificationImage} />
          </Animated.View>
        </>
      )}

      {/* Undelivered Orders */}
      {undeliveredOrders.length > 0 && (
  <View style={styles.orderBox}>
    <ScrollView style={styles.ordersScrollView}>
      {undeliveredOrders.map((order, index) => {
        if (hiddenOrders.includes(order._id)) return null; // Skip hidden orders

        return (
          <View key={index} style={styles.orderItemContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleHideOrder(order._id)} // Hide only this order
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {/* Order Details */}
            <TouchableOpacity
              style={styles.orderItem}
              onPress={() => {
                props.navigation.push('CyrMapDirection', {
                  orderId: order._id,
                  socket,
                  userId: order.bookedBy,
                });
              }}
            >
              <Text style={styles.orderText}>{order?.rideStatus}</Text>
              <Text style={styles.orderText}>Otp: {order?.otp}</Text>
              <Text style={styles.orderText}>Bill: {order?.bill}</Text>
              <Text style={styles.orderText}>Order ID: {order._id}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  lottie: {
    width: '100%',
    height: '50%',
  },
  permissionText: {
    fontSize: 20,
    color: 'black',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    padding: 10
  },
  inputContainer: {
    width: '100%',
    marginTop: 10,
  },
  input: {
    padding: 10,
    width: '80%',
    marginLeft: 10,
    color: 'black'
  },
  searchScreenContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f4f5',
    borderRadius: 20,
    paddingHorizontal: 20,
    padding: 10,
    marginTop: 8,
    width: '90%',
    marginLeft: '5%',
    zIndex: 1, // Ensure search bar remains visible
    color: 'black'
  },
  searchPlaceholder: {
    fontSize: 18,
    fontFamily: 'verdana',
    color: 'black',
    fontWeight: '650',
    marginLeft: 20
  },
  exploreHeading: {
    fontSize: 18,
    fontFamily: 'san-serif',
    fontWeight: '700',
    color: 'black',
    marginBottom: 18,
    textAlign: 'left'
  },
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 15,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  bottomImage: {
    width: '100%',
    height: width,
    resizeMode: 'contain'
  },
  notificationContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FF4C4C',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 5,
    zIndex: 3, // Place above the dimmed background
  },
  notificationText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationImage: {
    width: 30,
    height: 30,
    marginLeft: 10,
    resizeMode: 'contain',
  },
  dimBackground: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
    zIndex: 2, // Dimmed background appears behind the notification
  },
  suggestionsList: {
    backgroundColor: '#f0f0f5',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  suggestionText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '800'
  },
  suggestionText2: {
    fontSize: 16,
    color: 'grey',
  },
  vehicleContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10
  },
  categoryHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  vehicleOption: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10
  },
  activeVehicleOption: {
    borderColor: 'teal',
    borderWidth: 2,
    borderRadius: 20
  },
  vehicleText: {
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#5ecdf9',
    padding: 15,
    alignItems: 'center',
    borderRadius: 15,
  },
  bookButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14
  },
  offersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 20,
    marginVertical: 10,
  },
  offersContainer: {
    marginHorizontal: 20,
    marginBottom: 20
  },
  offersScrollContainer: {
    alignItems: 'center',
  },
  offerItem: {
    marginRight: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  offerImage: {
    width: 200,
    height: 100,
    borderRadius: 10,
  },
  offerText: {
    textAlign: 'center',
    color: '#0044FF',
    marginTop: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 23,
    color: '#000',
    fontWeight: '800',
    marginLeft: 10
  },
  locInputContainer: {
    backgroundColor: '#eeeeee',
    width: '90%',
    marginHorizontal: '5%',
    borderRadius: 20,
    borderColor: '#b9b3b9',
    borderWidth: 1,
    padding: 8,
    marginTop: 20
  },
  locInputContainer2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'none'
  },
  horizontalLine: {
    height: 1,
    marginHorizontal: 30,
    backgroundColor: '#b9b3b9',
  },
  horizontalLine2: {
    height: 1,
    backgroundColor: '#b9b3b9',
    marginTop: 20,
  },
  blueLine: {
    height: 2,
    backgroundColor: 'blue',
    position: 'absolute',
    left: 0,
  },
  map: {
    position: 'absolute',
    width: width,
    height: height,
    zIndex: 1
  },
  markerImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  headerContainer2: {
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: 50,
    width: 43
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly'
  },
  orderBox: {
    position: 'absolute',
    top: height / 1.9,               // Position the box 50 units from the bottom of the screen
    left: 0,
    right: 0,
    padding: 10,              // Padding around the entire order box
    backgroundColor: 'transparent', // Make the background transparent to see the light blue cards
  },
  ordersScrollView: {
    paddingHorizontal: 10,    // Padding inside the scroll view for better alignment
  },
  orderItem: {
    backgroundColor: '#68095f', // Light blue background for the order item
    borderRadius: 10,           // Rounded corners
    padding: 15,                // Space inside each order box
    marginBottom: 15,           // Space between each order box
    shadowColor: '#000',        // Optional: Shadow for a slight elevation effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,               // For Android shadow/elevation
  },
  orderText: {
    fontSize: 16,        // Adjust font size for readability
    color: '#FFFAFA',    // Snow-white text color
    marginBottom: 5,     // Space between text lines
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff6666',
    borderRadius: 20,
    padding: 5,
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderItemContainer: {
    position: 'relative', // Ensure relative positioning for the close button
    marginBottom: 15, // Add spacing between orders
  },
  restroContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2', // Light background for a clean look
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
},
messageText: {
    fontSize: 20,
    color: '#333', // Dark color for contrast
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
},
subMessageText: {
    fontSize: 16,
    color: '#666', // Lighter shade for secondary text
    textAlign: 'center',
    marginBottom: 30,
},
lottie: {
    width: width * 0.6, // Lottie animation width to cover a significant part of the screen
    height: height * 0.3, // Adjust height for good aspect ratio
    marginBottom: 30,
},
resbutton: {
    backgroundColor: '#68095f', // Vibrant blue for the button
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Shadow for Android
},
resbuttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
},
container3: {
    flex: 1,
    backgroundColor: '#f7f7f7', // Light, neutral background color
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
},
mainMessage: {
    fontSize: 22,
    color: '#2c3e50', // Dark color for contrast
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
},
subMessage: {
    fontSize: 18,
    color: '#7f8c8d', // Slightly lighter color for the secondary message
    textAlign: 'center',
    marginBottom: 30,
},
lottie2: {
    width: width * 0.7, // Large enough to be noticeable but not overwhelming
    height: height * 0.4, // Adjust height to maintain aspect ratio
},
});

export default CyrDashboard;
