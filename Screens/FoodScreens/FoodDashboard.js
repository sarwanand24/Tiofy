import React, { useEffect, useRef, useState } from 'react';
import { View, Text, PermissionsAndroid, TextInput, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { getAccessToken } from '../../utils/auth';
import Loading from '../Loading';

const { width, height } = Dimensions.get('window');

const FoodDashboard = (props) => {
    const [carouselData, setCarouselData] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [placeName, setPlaceName] = useState('');
    const [query, setQuery] = useState('');
    const [foods, setFoods] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [vegMode, setVegMode] = useState(false);
    const [city, setCity] = useState('');
    const [userName, setUserName] = useState('');
    const [offersData, setOffersData] = useState([]);
    const [loading, setLoading] = useState(true);  // Added loading state
    const [userLatitude, setUserLatitude] = useState(0);
    const [userLongitude, setUserLongitude] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const secondRowRef = useRef(null);
    const scrollViewRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    // Handle the fetch restaurants error nicely
    const [error, setError] = useState(null);  // Added error state

    const checkLocationPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLatitude(latitude);
                        setUserLongitude(longitude);
                        const jwtToken = await getAccessToken();

                        try {
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                            );
                            const data = await response.json();
                            const fullAddress = `${data.address.city}, ${data.address.state}, ${data.address.country}`;
                            setPlaceName(data.display_name);
                            setCity(fullAddress);
                        } catch (error) {
                            console.error('Error fetching place name:', error);
                        }

                        try {
                            await fetch("https://trioserver.onrender.com/api/v1/users/update-user-location", {
                                method: "POST",
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + jwtToken
                                },
                                body: JSON.stringify({ latitude, longitude })
                            });
                        } catch (error) {
                            console.error('Error updating location:', error);
                        }
                    },
                    (error) => {
                        console.log(error.code, error.message);
                    },
                    { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
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

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const userData = await AsyncStorage.getItem('Userdata');
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    setUserName(parsedData.fullName); // Assuming the full name is stored in 'fullName'
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserName();
    }, []);

    useEffect(() => {
        const fetchCarouselData = async () => {
            try {
                const response = await axios.get('https://trioserver.onrender.com/api/v1/users/food-carousel-images');
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

       // Function to filter restaurants based on the food names and restaurant name
       const searchRestaurants = (query) => {
        return restaurants.filter(restaurant => {
            // Check if the restaurant's name matches the search query
            const isRestaurantMatch = restaurant.restaurantName.toLowerCase().includes(query);

            console.log(isRestaurantMatch, query, '--------');
            

            // Check if any food item (both veg and non-veg) matches the search query
            const isFoodMatch = [
                ...restaurant.vegFoods,
                ...restaurant.nonvegFoods
            ].some(food => food.name.toLowerCase().includes(query));

            // Return true if either the restaurant name or any food item matches the query
            return isRestaurantMatch || isFoodMatch;
        });
    };

    const handleSearch = async(text) => {
        setQuery(text);

        if (text.trim() === '') {
            setFilteredRestaurants([]);
            setIsSearching(false);
        } else {
            const filteredData = searchRestaurants(text.toLowerCase());
            console.log('filtered---', filteredData);
            setFilteredRestaurants(filteredData);
            setIsSearching(true);
        }
    };

    // Divide the data into two rows
    const divideIntoRows = (data) => {
        const mid = Math.ceil(data.length / 2);
        return [data.slice(0, mid), data.slice(mid)];
    };

    const [row1, row2] = divideIntoRows(foods);

    const renderItem = ({ item }) => {
          const secureImageUrl = item.image.replace("http://", "https://");
      return (
        <TouchableOpacity style={styles.foodItem} onPress={()=>{handleSearch(item.name)}}>
        <Image source={{ uri: secureImageUrl }} style={styles.foodImage} />
        <Text style={styles.foodName}>{item.name}</Text>
    </TouchableOpacity>
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

    const fetchRestaurants = async () => {
        if (!city || userLatitude === 0 || userLongitude === 0) return;

        setLoading(true);
        try {
            const response = await fetch(`https://trioserver.onrender.com/api/v1/users/getAllRestaurants/${city}?vegMode=${vegMode}`);
            const data = await response.json();
            setFoods(data.foods);
            setRestaurants(data.restaurants);
            setError(null);

            if (data.restaurants.length > 0) {
                await fetchRoute(data.restaurants);
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            setError('Failed to load restaurants.');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoute = async (restaurants) => {
        try {
            const updatedRestaurants = await Promise.all(restaurants.map(async (restaurant) => {
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLongitude},${userLatitude};${restaurant.longitude},${restaurant.latitude}?overview=full`);
                const data = await response.json();
                const distance = data.routes[0].distance;
                const duration = data.routes[0].duration + 1500;

                return {
                    ...restaurant,
                    distance,
                    duration
                };
            }));

            setRestaurants(updatedRestaurants);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, [city, vegMode, userLatitude, userLongitude]);

    const renderRestaurants = ({ item, index }) => {
        const distanceInKm = (item.distance / 1000).toFixed(2);
    
        // Convert seconds to minutes and hours
        const hours = Math.floor(item.duration / 3600);
        const minutes = Math.floor((item.duration % 3600) / 60);

        const secureImageUrl = item.restaurantPhoto.replace("http://", "https://");
    
        return (
            <TouchableOpacity
                style={styles.restaurantContainer}
                onPress={() => {
                    props.navigation.push("Restaurant", { restro: item });
                }}
            >
                <Image
                    source={{ uri: secureImageUrl }}
                    style={styles.restroImg}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.restroName}>{item.restaurantName}</Text>
                    <Text style={styles.rating}>
                        <Icon name="star" size={20} color="green" style={styles.icon} />
                        {'\u00A0'}{item.ratings}
                    </Text>
                    <Text style={styles.restaurantDetails}>
                        {item.address} · {distanceInKm} km
                    </Text>
                    <Text style={styles.restaurantDetails}>
                        Duration: {hours} hours {minutes} minutes
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };


    if (loading) {
        return <Loading />
    }

    if(restaurants.length === 0){
        return <Text style={styles.noRestaurantsText}>No Restaurants available in the city</Text>
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.locationContainer}>
                <Icon name="location" size={24} color="red" />
                <Text style={styles.locationText}>{placeName ? placeName : "Fetching location..."}</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <TextInput
                    placeholder="Search Here"
                    value={query}
                    onChangeText={(text) => handleSearch(text)}
                    style={styles.searchInput}
                />
                <Icon
                    name="search"
                    size={24}
                    color="#888888"
                    style={styles.searchIcon}
                />
            </View>

            {isSearching ? (
                <FlatList
                    data={filteredRestaurants}
                    renderItem={renderRestaurants}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.noRestaurantsText}>No restaurants or food items found</Text>}
                />
            ) : (
                <View>
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
                            onSnapToItem={(index) => setActiveSlide(index)}
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

                    {/* Subheading with horizontal lines */}
                    <View style={styles.subheadingContainer}>
                        <View style={styles.horizontalLine} />
                        <Text style={styles.subheadingText}>{userName}, What's on your mind?</Text>
                        <View style={styles.horizontalLine} />
                    </View>

                    {/* Render restaurant or loading/error message */}
                    <View style={styles.foodListsContainer}>
                        {/* First Row */}
                        <FlatList
                            data={row1}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.row}
                            onScroll={(event) => {
                                // Sync scroll for second row
                                const xOffset = event.nativeEvent.contentOffset.x;
                                secondRowRef.current.scrollToOffset({ offset: xOffset });
                            }}
                        />

                        {/* Second Row */}
                        <FlatList
                            data={row2}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.row}
                            ref={secondRowRef}
                        />
                    </View>


                    {/* Discounts & Offers */}
                    {
                        offersData.length > 0 && (
                            <>
                                <View style={styles.offersContainer}>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.offersScrollContainer}
                                        ref={scrollViewRef}
                                    >
                                        {offersData.map((offer, index) => (
                                            <View key={index} style={styles.offerItem}>
                                                <Image
                                                    source={{ uri: offer.imageUrl }}
                                                    style={styles.offerImage}
                                                    resizeMode="cover"
                                                />
                                                <Text style={styles.offerText}>{offer.title}</Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            </>
                        )
                    }

                    {/* Restaurant */}
                    {/* Subheading with horizontal lines */}
                    <View style={styles.subheadingContainer}>
                        <View style={styles.horizontalLine} />
                        <Text style={styles.subheadingText}>For You</Text>
                        <View style={styles.horizontalLine} />
                    </View>
                    <View style={{ paddingBottom: 50 }}>
                        <FlatList
                            data={restaurants}
                            keyExtractor={item => item.id}
                            renderItem={renderRestaurants}
                        />
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    locationText: {
        fontSize: 16,
        marginLeft: 10,
        fontWeight: 'bold',
        color: '#333',
        width: width / 2
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'lightblue',
        borderRadius: 20,
        paddingHorizontal: 10,
        marginTop: 20,
        width: '90%',
        marginLeft: '5%'
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
        paddingLeft: 10, // Add padding to the left to avoid text being too close to the edge
        color: '#333',
    },
    searchIcon: {
        padding: 5,
        backgroundColor: 'blue',
        borderRadius: 20,
    },
    foodListsContainer: {
        marginVertical: 10,
    },
    row: {
        paddingVertical: 10,
    },
    foodItem: {
        marginHorizontal: 10,
        alignItems: 'center',
    },
    foodImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    foodName: {
        marginTop: 5,
        textAlign: 'center',
    },
    offersContainer: {
        marginHorizontal: 20,
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
        marginTop: 10,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    carouselItem: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    carouselImage: {
        width: '100%',
        height: 200,
    },
    carouselTextContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 5,
        padding: 5,
    },
    carouselText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    paginationContainer: {
        backgroundColor: 'transparent',
        paddingVertical: 10,
    },
    dotStyle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 8,
        backgroundColor: '#0044FF',
    },
    inactiveDotStyle: {
        backgroundColor: '#C4C4C4',
    },
    subheadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    horizontalLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#ccc',
    },
    subheadingText: {
        marginHorizontal: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    noRestaurantsText: {
        textAlign: 'center',
        color: '#333',
        fontSize: 16,
        marginTop: 20,
    },
    restaurantContainer: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    restroImg: {
        width: 150,
        height: 150,
        borderRadius: 8,
        marginRight: 10,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    restroName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    rating: {
        fontSize: 16,
        color: '#555',
        marginVertical: 5,
        alignItems: 'center',
        flexDirection: 'row',
    },
    restaurantDetails: {
        fontSize: 14,
        color: '#777',
        marginVertical: 2,
    },
    icon: {
        marginRight: 5,
    },

});

export default FoodDashboard;
