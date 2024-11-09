import React, { useEffect, useRef, useState } from 'react';
import { View, Text, PermissionsAndroid, TextInput, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { getAccessToken } from '../../utils/auth';
import moment from 'moment';
import { Switch } from 'react-native-paper';
import FoodLoader from './FoodLoader';
import socket from '../../utils/Socket';

const { width, height } = Dimensions.get('window');

const FoodDashboard = (props) => {

    const [carouselData, setCarouselData] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const [placeName, setPlaceName] = useState('');
    const [query, setQuery] = useState('');
    const [foods, setFoods] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [vegMode, setVegMode] = useState(false);//do this in frontend now
    const [city, setCity] = useState('');
    const [userName, setUserName] = useState('');
    const [offersData, setOffersData] = useState([]);
    const [loading, setLoading] = useState(true);  // Added loading state
    const [userLatitude, setUserLatitude] = useState(0);
    const [userLongitude, setUserLongitude] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [undeliveredOrders, setUndeliveredOrders] = useState([]);
    const [weatherData, setWeatherData] = useState(null);
    const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
    const [festiveImg, setFestiveImg] = useState('');

    const secondRowRef = useRef(null);
    const scrollViewRef = useRef(null);
    const scrollIntervalRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;

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
                        const jwtToken = await AsyncStorage.getItem('token');
                        try {  
                            console.log(latitude, longitude);
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                                {
                                  headers: {
                                    'User-Agent': 'ReactNativeApp/1.0', // Include the User-Agent header
                                  },
                                }
                              );
                            console.log('responserani', response);
                            const data = await response.json();
                            console.log('data', data);
                            const fullAddress = `${data.address.city}, ${data.address.state}, ${data.address.country}`;
                            setCity(fullAddress);
                            setPlaceName(data.display_name);
                            await fetchRestaurants();
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

    useEffect(() => {
        const getWeatherData = async () => {
            try {
                const response = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${userLatitude}&lon=${userLongitude}&appid=8b9b1be2dbce1e5377dd11daec894f31`
                );
                console.log('response---->', response.data);

                const { main, weather } = response.data;
                const data = {
                    temp: main.temp,
                    condition: weather[0].main,
                    isRaining: weather[0].main.toLowerCase().includes('rain'),
                };
                setWeatherData(data);
                console.log('weatherrrrr', weatherData);

            } catch (error) {
                console.error("Error fetching weather data: ", error);
                return null;
            }
        }
        getWeatherData();
    }, [placeName])

    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        // Calculate the height based on the availability of weather data and image
        const baseHeight = 150; // Minimum height with search bar only
        const weatherHeight = weatherData ? 80 : 0; // Height for weather data
        const imageHeight = weatherData && weatherData.isRaining ? 120 : 0; // Height for image

        // Update the header height based on the content
        setHeaderHeight(baseHeight + weatherHeight + imageHeight);
    }, [weatherData]);

    // Interpolating opacity and translation values for the fading effect
    const fadeOutOpacity = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const translateY = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [0, -50],
        extrapolate: 'clamp',
    });

    const headerBackgroundColor = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: ['rgba(173, 216, 230, 1)', 'lightgrey'],
        extrapolate: 'clamp',
    });


    const headerHeightAnim = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [headerHeight, 160],
        extrapolate: 'clamp',
    });

    const fetchRestaurants = async () => {
        if (!city || userLatitude === 0 || userLongitude === 0) return;
        try {
            const response = await fetch(`https://trioserver.onrender.com/api/v1/users/getAllRestaurants/${city}?vegMode=${vegMode}`);
            const data = await response.json();
            setFoods(data.foods);
            setRestaurants(data.restaurants);
            setError(null);

            if (data.restaurants.length > 0) {
                setLoading(false)
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

    useEffect(() => {
        fetchRestaurants();
    }, [city, vegMode]);

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

    const handleSearch = async (text) => {
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
            <TouchableOpacity style={styles.foodItem} onPress={() => { handleSearch(item.name) }}>
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
                const response2 = await axios.get('https://trioserver.onrender.com/api/v1/users/festive-offer-images');
                setFestiveImg(response2.data[0]?.imageUrl)
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

    const fetchRoute = async (restaurants) => {
        try {
            const updatedRestaurants = await Promise.all(restaurants.map(async (restaurant) => {
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLongitude},${userLatitude};${restaurant.longitude},${restaurant.latitude}?overview=full`);
                const data = await response.json();
                console.log(data.routes[0], 'responseee');

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
        const filteredData = restaurants.filter((restaurant) => restaurant.distance / 1000 < 5);
        setNearbyRestaurants(filteredData);
    }, [restaurants])
    

    const renderRestaurants = ({ item, index }) => {
        const distanceInKm = (item.distance / 1000).toFixed(2);

        // Convert seconds to minutes and hours
        const hours = Math.floor(item.duration / 3600);
        const minutes = Math.floor((item.duration % 3600) / 60);

        const secureImageUrl = item.restaurantPhoto.replace("http://", "https://");

        // Helper function to convert time strings like '8am' or '11pm' into a comparable moment object
        const convertTimeToMoment = (time) => {
            return moment(time, ["hA"]); // 'hA' parses times like '8am', '11pm'
        };

        const openingTime = convertTimeToMoment(item.openingTime);
        const closingTime = convertTimeToMoment(item.closingTime);

        // Adjust closing time if it's earlier than opening time, meaning it crosses midnight
        if (closingTime.isBefore(openingTime)) {
            closingTime.add(1, 'day'); // Add 1 day to closing time to handle the next day scenario
        }

        const currentTime = moment();

        // Check if the current time is within the opening and closing times
        const isRestaurantOpen = currentTime.isBetween(openingTime, closingTime);

        return (
            <TouchableOpacity
                style={[styles.restaurantContainer, !isRestaurantOpen && styles.disabledContainer]} // Apply greyish style if closed
                onPress={() => {
                    if (isRestaurantOpen) {
                        props.navigation.push("Restaurant", { restro: item });
                    }
                }}
                disabled={!isRestaurantOpen} // Disable if the restaurant is closed
            >
                <Image
                    source={{ uri: secureImageUrl }}
                    style={styles.restroImg}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.restroName}>{item.restaurantName}</Text>
                    <Text style={styles.rating}>
                        <Icon name="star" size={20} color="green" style={styles.icon} />
                        {'\u00A0'}{(item.ratings).toFixed(1)}
                    </Text>
                    <Text style={styles.restaurantDetails}>
                        {item.address} · {distanceInKm} km · {minutes} minutes
                    </Text>
                    <Text style={styles.restaurantDetails}>
                        {item.cuisineType}
                    </Text>
                    {/* <Text style={styles.restaurantDetails}>
                        Duration: {hours} hours {minutes} minutes
                    </Text> */}
                    {!isRestaurantOpen && (
                        <Text style={styles.closed}>Closed</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        const fetchUndeliveredOrders = async () => {
            try {
                const token = await AsyncStorage.getItem('token')
                const response = await axios.get('https://trioserver.onrender.com/api/v1/foodyOrder/getUserUndeliveredOrders', {
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

    const renderNearbyRestro = ({ item, index }) => {
        const distanceInKm = (item.distance / 1000).toFixed(2);

        // Convert seconds to minutes and hours
        const hours = Math.floor(item.duration / 3600);
        const minutes = Math.floor((item.duration % 3600) / 60);

        const secureImageUrl = item.restaurantPhoto.replace("http://", "https://");

        // Helper function to convert time strings like '8am' or '11pm' into a comparable moment object
        const convertTimeToMoment = (time) => {
            return moment(time, ["hA"]); // 'hA' parses times like '8am', '11pm'
        };

        const openingTime = convertTimeToMoment(item.openingTime);
        const closingTime = convertTimeToMoment(item.closingTime);

        // Adjust closing time if it's earlier than opening time, meaning it crosses midnight
        if (closingTime.isBefore(openingTime)) {
            closingTime.add(1, 'day'); // Add 1 day to closing time to handle the next day scenario
        }

        const currentTime = moment();

        // Check if the current time is within the opening and closing times
        const isRestaurantOpen = currentTime.isBetween(openingTime, closingTime);

        return (
            <TouchableOpacity
                style={[styles.restaurantContainerNearBy, !isRestaurantOpen && styles.disabledContainer]} // Apply greyish style if closed
                onPress={() => {
                    if (isRestaurantOpen) {
                        // Navigate to restaurant details page
                        props.navigation.push("Restaurant", { restro: item });
                    }
                }}
                disabled={!isRestaurantOpen} // Disable if the restaurant is closed
            >
                <Image
                    source={{ uri: secureImageUrl }}
                    style={styles.restaurantImageNearBy}
                />
                <View style={styles.restaurantDetailsNearBy}>
                    <Text style={styles.restaurantNameNearBy}> {item.restaurantName}</Text>
                    <Text style={styles.restaurantInfoNearBy}><Icon name="star" size={14} color="green" style={styles.icon} />
                    {'\u00A0'}{(item.ratings).toFixed(1)} · {distanceInKm} km · {minutes} minutes</Text>
                    <Text style={styles.restaurantInfoNearBy2}>{item.cuisineType}</Text>
                    {!isRestaurantOpen && (
                        <Text style={styles.closed}>Closed</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <FoodLoader />
    }

    if (restaurants.length === 0) {
        return <Text style={styles.noRestaurantsText}>Sorry! we don't serve in your area.</Text>
    }

    const onToggleSwitch = () => {
        setVegMode(!vegMode);
    };

    return (
        <Animated.ScrollView
            style={styles.container} // Dynamic marginTop for scrollView
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            stickyHeaderIndices={[0]}
        >
            <View>
                <Animated.View style={[styles.headerContainer, { height: headerHeightAnim, backgroundColor: headerBackgroundColor }]}>
                    <View style={styles.locationContainer}>
                        <Icon name="location" size={24} color="red" />
                        <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                            {placeName ? placeName : "Fetching location..."}
                        </Text>
                    </View>

                    <View style={styles.vegmode}>
                            <Switch value={vegMode} onValueChange={onToggleSwitch} />
                            <Text style={{color:'red'}}>Veg Mode</Text>
                     </View>

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

                    {/* Conditionally render the weather info and image */}
                    {weatherData && (
                        <Animated.View style={[styles.weatherContainer, { opacity: fadeOutOpacity, transform: [{ translateY }] }]}>
                                <Text style={styles.weatherText}>
                                Weather: {(weatherData.temp - 273.15).toFixed(1)}°C {weatherData.condition}
                            </Text>
                            {weatherData.isRaining && (
                                <View style={styles.rainContainer}>
                                    <Image
                                        source={{ uri: 'https://th.bing.com/th/id/OIP.fTzXqhwwNDZHkZzc0zv-3wAAAA?w=300&h=299&rs=1&pid=ImgDetMain' }}
                                        style={styles.rainImage}
                                    />
                                    <Text style={styles.rainText}>
                                        Due to the rain gods being extra generous today, expect a slight delay with your rider's arrival.
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {festiveImg && (
                        <Animated.Image
                        source={{ uri: festiveImg.replace('http://', 'https://') }}
                        style={[styles.headerOffer, { opacity: fadeOutOpacity, transform: [{ translateY }] }]}
                    />
                    )}

                </Animated.View>
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

                    {/* Subheading with horizontal lines */}
                    {nearbyRestaurants.length > 0 && (
                        <>
                            <View style={styles.subheadingContainer}>
                                <View style={styles.horizontalLine} />
                                <Text style={styles.subheadingText}>Top Rated, Near You</Text>
                                <View style={styles.horizontalLine} />
                            </View>

                            <FlatList
                                data={nearbyRestaurants}
                                renderItem={renderNearbyRestro}
                                keyExtractor={(item) => item._id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                            />
                        </>
                    )}

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
                                                    source={{ uri: offer.imageUrl.replace('http://', 'https://') }}
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

                    {/* Undelivered Orders */}
                    {undeliveredOrders.length > 0 && (
                        <View style={styles.orderBox}>
                            <ScrollView style={styles.ordersScrollView}>
                                {undeliveredOrders.map((order, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.orderItem}
                                        onPress={() => {
                                            props.navigation.push('MapDirection', {
                                                orderId: order._id,
                                                socket,
                                                userId: order.orderedBy,
                                            });
                                        }}
                                    >
                                        <Text style={styles.orderText}>Your recent order is on the way</Text>
                                        <Text style={styles.orderText}>Order ID: {order._id}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                </View>
            )}
        </Animated.ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        padding: 10,
        backgroundColor: 'lightblue', // This will be animated to grey when scrolled up
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingBottom: 20,
        zIndex: 1,
        overflow: 'hidden',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 17,
    },
    locationText: {
        fontSize: 16,
        marginLeft: 8,
        fontWeight: 'bold',
        color: '#333',
        width: '50%',
    },
    vegmode: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 10,
        marginTop: 20,
        width: '90%',
        marginLeft: '5%',
        zIndex: 1, // Ensure search bar remains visible
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
        paddingLeft: 10,
        color: '#333',
    },
    searchIcon: {
        padding: 5,
        backgroundColor: 'blue',
        borderRadius: 20,
    },
    weatherContainer: {
        paddingHorizontal: 20,
        borderRadius: 15,
        marginTop: 10,
        alignItems: 'center',
        opacity: 1, // This will be animated to fade out
    },
    weatherText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    rainContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 10,
        padding: 10,
        marginTop: 2,
        width: '100%',
    },
    rainImage: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    rainText: {
        fontSize: 14,
        color: '#d9534f',
        fontStyle: 'italic',
        textAlign: 'left',
        lineHeight: 18,
        flexShrink: 1,
    },
    headerOffer: {
        marginTop: 10,
        width: '100%',
        height: 120,
        borderRadius: 10,
        opacity: 1, // This will be animated to fade out
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
        color: 'black'
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
        marginTop: height / 2
    },
    disabledContainer: {
        backgroundColor: '#d3d3d3', // Light grey when disabled
        opacity: 0.6, // Add some transparency for disabled state
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
    restaurantContainerNearBy: {
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 3, // Add shadow for elevation on Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        margin: 5,
        padding: 5,
        alignItems: 'center',
        width: 130, // Adjust as needed
    },
    restaurantImageNearBy: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginBottom: 3,
    },
    restaurantDetailsNearBy: {
        alignItems: 'center',
    },
    restaurantNameNearBy: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    restaurantInfoNearBy: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    restaurantInfoNearBy2: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    closed: {
        fontSize: 16,
        color: 'red',
        fontWeight: 'bold',
        textAlign: 'center',
    }
});

export default FoodDashboard;
