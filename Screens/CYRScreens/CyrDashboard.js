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

const { width, height } = Dimensions.get('window');

const CyrDashboard = (props) => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
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

  const onMapLayout = () => {
    setMapReady(true);
  };

  const scrollViewRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  const animation = useRef(new Animated.Value(0)).current;

  // Dummy JSON data for locations
  const locationsData = [
    { lat: 28.7041, long: 77.1025, placeName: 'New Delhi', city: 'Delhi', pincode: '110001' },
    { lat: 19.0760, long: 72.8777, placeName: 'Mumbai', city: 'Mumbai', pincode: '400001' },
    { lat: 22.3302307, long: 87.323509, placeName: 'Chota Tengra', city: 'Kharagpur, West Bengal, India', pincode: '721301' },
    // Add more as needed
  ];

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

  // Match current location with JSON data
  const matchLocation = (lat, long) => {
    try {
      const matchedLocation = locationsData.find(
        (loc) => Math.abs(loc.lat - lat) < 0.01 && Math.abs(loc.long - long) < 0.01
      );
      console.log('MatchedLocation:', matchedLocation)
      if (matchedLocation) {
        setPermissionScreen(false);
        setPickupLocation(matchedLocation);
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
            console.error('Error fetching undelivered orders:', error);
        }
    };

    fetchUndeliveredOrders();
}, []);

  // Function to handle location input change for pickup or drop
  const handleLocationInputChange = (text, isPickup) => {
    const suggestions = locationsData.filter((loc) =>
      loc.placeName.toLowerCase().includes(text.toLowerCase())
    );

    if (isPickup) {
      setPickupLocation({ placeName: text });
      setPickupSuggestions(suggestions);
    } else {
      setDropLocation({ placeName: text });
      setDropSuggestions(suggestions);
    }
  };

  // Select suggestion for pickup or drop
  const selectSuggestion = (location, isPickup) => {
    if (isPickup) {
      setPickupLocation(location); // Set full location details for pickup
      setPickupSuggestions([]);    // Clear suggestions
    } else {
      setDropLocation(location);    // Set full location details for drop
      setDropSuggestions([]);
    }
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

      setRouteDistance(distance);
      setRouteDuration(duration);

      const coordinates = polyline.decode(encodedPolyline).map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));

      setRouteCoordinates(coordinates);
    } catch (error) {
      console.error('Error fetching route:', error);
    } 
  };

  useEffect(() => {
    if (ridesData?.length) {
      console.log('check1', ridesData)
      Animated.timing(slideUpAnim, {
        toValue: 500,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [ridesData])

  useEffect(()=>{
        setSelectedVehicleType(ridesData.length > 0 ? ridesData[0].vehicleType : null)
  }, [ridesData])

  const handleVehicleSelect = (vehicleType) => {
    setSelectedVehicleType(vehicleType); // Set selected vehicle type
  };

  useEffect(() => {
    const fetchOffersData = async () => {
      try {
        const response = await axios.get('https://trioserver.onrender.com/api/v1/users/offer-images');
        setOffersData(response.data);
      } catch (error) {
        console.error('Error fetching offers data', error);
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
    setLoading(true);// show rider search here

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
      const bill = (routeDistance / 1000).toFixed(1) * 10;// make it autometa
      socket.emit("CyrRidePlaced", { riders: filteredRiders, userDeviceToken, otp, Userdata, socketId: socket.id, bill, pickupLocation, dropLocation, selectedVehicleType })
      // Here you can proceed with the booking logic using filteredRiders
    } else {
      // Handle case where the selected vehicle type doesn't match any category
      console.warn('No riders available for this vehicle type.');
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
          setLoading(false);
          // Navigate to the MapDirection screen
          props.navigation.push("CyrMapDirection", { 
            orderId: data.orderId, 
            socket, 
            userId: Userdata._id 
          });
        }
      } catch (error) {
        console.error("Error handling order accepted event: ", error);
      }
    };

    // Set up the socket listener
    socket.on("CyrRideAcceptedbyRider", handleOrderAccepted);

    // Cleanup the socket listener when the component unmounts
    return () => {
      socket.off("CyrRideAcceptedbyRider", handleOrderAccepted);
    };
  }, [socket]); 

  socket.on("NoRiderFoundForCYR", async (data) => {
    const StringUserdata = await AsyncStorage.getItem("Userdata")
    const Userdata = JSON.parse(StringUserdata);
    if (data.userId == Userdata._id) {
      console.log("Show No Rider Available or Found Screen Animation...")
      setManualEntry(false);
      //replace below with diff animation
      return (
      <CyrLoader />
      );
    }
  })

  useEffect(() => {
    if (manualEntry) {
      // Focus on the empty TextInput
      if (!pickupLocation?.placeName) {
        pickupInputRef.current?.focus();
        setHeaderText('Pickup');
      } else if (!dropLocation?.placeName) {
        dropInputRef.current?.focus();
        setHeaderText('Drop');
      }
    }
  }, [manualEntry]);

  const handleLocationFocus = (isPickup) => {
    setHeaderText(isPickup ? 'Pickup' : 'Drop');
  };

  useEffect(() => {
    const calculateArrivalTime = () => {
      const currentTime = new Date();
      currentTime.setMinutes(currentTime.getMinutes() + routeDuration);
      
      // Format the time (hh:mm AM/PM)
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
      
      setArrivalTime(formattedTime);
    };

    calculateArrivalTime();
  }, [routeDuration]);

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
            <TextInput
              ref={pickupInputRef}
              style={styles.input}
              placeholder="Pickup Location"
              value={pickupLocation?.placeName || ''}
              onChangeText={(text) => handleLocationInputChange(text, true)}
              onFocus={() => handleLocationFocus(true)}
            />
          </View>
          <View style={styles.horizontalLine} />
          {/* Drop Input */}
          <View style={styles.locInputContainer2}>
            <Icon name="circle-dot" size={15} color="red" />
            <TextInput
              ref={dropInputRef}
              style={styles.input}
              placeholder="Drop Location"
              value={dropLocation?.placeName || ''}
              onChangeText={(text) => handleLocationInputChange(text, false)}
              onFocus={() => handleLocationFocus(false)}
            />
          </View>
        </View>

        <View style={styles.horizontalLine2} >
          <Animated.View style={[styles.blueLine, { width: animatedWidth }]} />
        </View>

        {/* Drop Suggestions List */}
        {dropSuggestions.length > 0 && (
          <FlatList
            data={dropSuggestions}
            keyExtractor={(item) => item.pincode}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionContainer} onPress={() => selectSuggestion(item, false)}>
                <Icon name="clock-rotate-left" size={15} color="darkblue" />
                <View style={{ marginLeft: 20 }}>
                  <Text style={styles.suggestionText}>{item.placeName}</Text>
                  <Text style={styles.suggestionText2}>{item.city}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
          />
        )}
        {/* Pickup Suggestions List */}
        {pickupSuggestions.length > 0 && (
          <FlatList
            data={pickupSuggestions}
            keyExtractor={(item) => item.pincode}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionContainer} onPress={() => selectSuggestion(item, true)}>
                <Icon name="clock-rotate-left" size={15} color="darkblue" />
                <View style={{ marginLeft: 20 }}>
                  <Text style={styles.suggestionText}>{item.placeName}</Text>
                  <Text style={styles.suggestionText2}>{item.city}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
          />
        )}
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
                <Image source={require('../../assets/bike.png')} style={styles.markerImage} />
              </Marker>

              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="black"
                  strokeWidth={5}
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
                    <Image source={require('../../assets/bike.png')} style={styles.markerImage} />
                   <View>
                   <Text
                    style={[
                      styles.vehicleText,
                      {marginLeft:10, fontSize:16, fontWeight:'700'}
                    ]}
                  >
                    {vehicle.vehicleType}
                  </Text>
                  <Text
                    style={[
                      styles.vehicleText,
                      {marginLeft:10, fontSize:12}
                    ]}
                  >
                    Drop {arrivalTime}
                  </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.vehicleText,
                      {marginLeft:10, fontSize:16, fontWeight:'700'}
                    ]}
                  >
                     Rs{(routeDistance / 1000).toFixed(1) * 10}
                  </Text>
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
          <TouchableOpacity>
            <View style={{ backgroundColor: '#f5f4f5', padding: 8, borderRadius: 20 }}>
              <Image source={require('../../assets/bike.png')} style={styles.icon} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: '700' }}>Bike</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={{ backgroundColor: '#f5f4f5', padding: 8, borderRadius: 20 }}>
              <Image source={require('../../assets/cab.png')} style={styles.icon} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: '700' }}>Cab</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={{ backgroundColor: '#f5f4f5', padding: 8, borderRadius: 20 }}>
              <Image source={require('../../assets/cab.png')} style={styles.icon} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: '700' }}>Auto</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={{ backgroundColor: '#f5f4f5', padding: 8, borderRadius: 20 }}>
              <Image source={require('../../assets/cab.png')} style={styles.icon} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontWeight: '700' }}>Auto</Text>
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
                      <Text style={styles.offerText}>{offer.title}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </>
        )
      }

      <Image source={require('../../assets/bike.png')} style={styles.bottomImage} />
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
                                {undeliveredOrders.map((order, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.orderItem}
                                        onPress={() => {
                                            props.navigation.push('CyrMapDirection', {
                                                orderId: order._id,
                                                socket,
                                                userId: order.bookedBy,
                                            });
                                        }}
                                    >
                                        <Text style={styles.orderText}>Your current ride</Text>
                                        <Text style={styles.orderText}>Order ID: {order._id}</Text>
                                    </TouchableOpacity>
                                ))}
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
    backgroundColor: 'transparent',
    width: '80%',
    marginLeft: 10
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
    resizeMode: 'contain',
  },
  bottomImage: {
    width: '100%',
    height: height * 0.3,
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
    backgroundColor: 'lightblue',
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
    backgroundColor: '#ADD8E6', // Light blue background for the order item
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
});

export default CyrDashboard;
