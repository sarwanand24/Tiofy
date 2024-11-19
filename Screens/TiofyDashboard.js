import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput, ScrollView, Dimensions, StyleSheet,
  PermissionsAndroid
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Icon from 'react-native-vector-icons/Ionicons'; // for icons
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { getAccessToken } from '../utils/auth';
import ErrorPopup from './ErrorPopup';

const { width } = Dimensions.get('window');

const TiofyDashboard = (props) => {

  const [greeting, setGreeting] = useState('');
  const [carouselData, setCarouselData] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [offersData, setOffersData] = useState([]);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scrollViewRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 18) {
        setGreeting('Good Afternoon');
      } else if (hour < 21) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };

    updateGreeting();

    // Optionally, update greeting every hour
    const intervalId = setInterval(updateGreeting, 3600000); // 1 hour

    return () => clearInterval(intervalId); // cleanup on unmount
  }, []);

  async function saveTokenToDatabase(token) {
    const jwtToken = await getAccessToken();
    console.log('jwt log', jwtToken);
    await fetch("https://trioserver.onrender.com/api/v1/users/set-device-token", {
      method: "POST",
      headers: new Headers({
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        "token": token
      })
    })
      .then(res => res.json())
      .then(async (data) => {
        console.log(data);
        try {
          console.log(data.data);
          if (data.data.deviceToken) {
            await AsyncStorage.setItem("deviceToken", data.data.deviceToken);
          }
          else {
            setErrorMessage('Error in Storing Device Token');
            setErrorVisible(true);
          }
        } catch (error) {
          console.log("Error in Storing Device Token", error);
          setErrorMessage('Error in Storing Device Token');
          setErrorVisible(true);//Show the proper error with the help of message and received and use some code eg. 101 to identify the error
        }
      })

  }

  const checkLocationPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                },
                (error) => {
                    console.log(error.code, error.message);
                },
                { timeout: 5000, maximumAge: 100000000000 }
            );
        } else {
            console.log('Location permission is not granted');
        }
    } catch (error) {
        console.warn(error);
    }
};

useEffect(() => {
    checkLocationPermission();
}, []);

  useEffect(()=> {
    const locationPermission = async() => {
      try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
           console.log('granted location permision', granted);     
        } else {
            console.log('Location permission is not granted');
        }
    } catch (error) {
        console.warn(error);
    }
    }

    locationPermission()
  }, [])

  useEffect(() => {
    // Fetch carousel data from server
    const fetchCarouselData = async () => {
      try {
        const response = await axios.get('https://trioserver.onrender.com/api/v1/users/carousel-images');
        setCarouselData(response.data);
      } catch (error) {
        console.error('Error fetching carousel data', error);
      }
    };

    fetchCarouselData();
  }, []);

  const renderCarouselItem = ({ item }) => {
    const secureImageUrl = item.imageUrl.replace("http://", "https://");
    return (
      <View style={[styles.carouselItem, { backgroundColor: 'white' }]}>
      <Image
        source={{ uri: secureImageUrl }}
        style={styles.carouselImage}
        resizeMode="cover"
      />
      <View style={styles.carouselTextContainer}>
        <Text style={styles.carouselText}>{item.title}</Text>
      </View>
    </View>
    );
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

  return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          {/* Header with Logo and Menu */}
        <View style={styles.header}>
          <Image
            source={require('../assets/Logo/tiofydashboard.png')} // replace with your logo image
            style={styles.logo}
          />
          <View style={styles.greetContainer}>
      <Text style={styles.greetingText}>{greeting}</Text>
    </View>
        </View>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Search Here"
              style={styles.searchInput}
            />
            <Icon name="search" size={24} style={styles.searchIcon} />
          </View>

          {/* Slideshow Banner */}
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <Carousel
              data={carouselData}
              renderItem={renderCarouselItem}
              sliderWidth={width}
              itemWidth={width * 0.8}
              loop={true}
              autoplay={true}
              autoplayDelay={2000}
              autoplayInterval={3000}
              onSnapToItem={(index) => setActiveSlide(index)} // Update active slide index
            />
            <Pagination
              dotsLength={carouselData.length}
              activeDotIndex={activeSlide}
              containerStyle={styles.paginationContainer}
              dotStyle={styles.dotStyle}
              inactiveDotStyle={styles.inactiveDotStyle}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
          </View>

          {/* Categories */}
          <Text style={styles.categoriesTitle}>Our Categories</Text>

          <ScrollView 
          horizontal
          style={styles.categoriesContainer}>
            <TouchableOpacity style={styles.categoryItem} onPress={() => { props.navigation.push('FoodDashboard') }}>
               <Image 
    source={require('../assets/Food.png')} // Replace with your image path
    style={styles.categoryImage}
  />
              <Text style={styles.categoryText}>Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryItem} onPress={() => {props.navigation.push('HotelDashboard')}}>
                <Image 
    source={require('../assets/Hotel.png')} // Replace with your image path
    style={styles.categoryImage}
  />
              <Text style={styles.categoryText}>Hotel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryItem} onPress={() => { props.navigation.push('CyrDashboard') }}>
               <Image 
    source={require('../assets/cab.png')} // Replace with your image path
    style={styles.categoryImage}
  />
              <Text style={styles.categoryText}>Auto&Cab</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryItem}>
              <Image 
    source={require('../assets/Saloon.png')} // Replace with your image path
    style={styles.categoryImage}
  />
              <Text style={styles.categoryText}>Laundry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryItem}>
            <Image 
    source={require('../assets/vegetable.png')} // Replace with your image path
    style={styles.categoryImage}
  />
              <Text style={styles.categoryText}>Liquor</Text>
            </TouchableOpacity>
          </ScrollView>

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
        </ScrollView>
        <ErrorPopup
          visible={errorVisible}
          message={errorMessage}
          onClose={() => setErrorVisible(false)}
        />
      </View>
  );
};

const styles = StyleSheet.create({
 header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
  },
  logo: {
    width: 50,
    height: 50,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5ecdf9',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginTop: 10,
    width: '90%',
    marginLeft: '5%',
    borderColor: '#5ecdf9',
    borderWidth: 2
},
searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingLeft: 10, // Add padding to the left to avoid text being too close to the edge
    color: 'white',
},
searchIcon: {
    padding: 5,
    backgroundColor: '#5ecdf9',
    color: "white",
    borderRadius: 20,
},
  categoriesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 20,
    marginVertical: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  categoryItem: {
    width: 90, // Fixed width for each item
    alignItems: 'center',
    margin: 5,  // Space around each item
    borderWidth: 2,
    borderRadius: 15,
    borderColor: '#5ecdf9',
  },
   categoryImage: {
    width: 70, 
    height: 90, 
    borderRadius: 50,
  },
  categoryText: {
    marginTop: 5,
    color: 'black',
    fontWeight: 'bold'
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0044FF',
  },
  carouselItem: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselTextContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
  },
  carouselText: {
    color: '#FFF',
    fontSize: 20,
  },
  paginationContainer: {
    paddingVertical: 10,
  },
  dotStyle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5ecdf9',
  },
  inactiveDotStyle: {
    backgroundColor: '#C4C4C4',
  },
  offersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 20,
    marginVertical: 10,
  },
  offersContainer: {
    marginHorizontal: 20,
  },
  offersScrollContainer: {
    alignItems: 'center',
  },
  offerItem: {
    marginRight: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#5ecdf9',
    padding: 5,
  },
  offerImage: {
    width: 200,
    height: 100,
    borderRadius: 10,
  },
  offerText: {
    textAlign: 'center',
    color: 'white',
    marginTop: 5,
  },
  greetContainer: {
    padding: 10
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'crimson',
    
  },
});

export default TiofyDashboard;
