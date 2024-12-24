import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
    Image,
    ImageBackground,
    StatusBar
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import HotelLoader from './HotelLoader';

const { width, height } = Dimensions.get('window');

function HotelDashboard(props) {

    const [query, setQuery] = useState('');
    const [allHotelsCity, setAllHotelsCity] = useState([]);
    const [allHotels, setAllHotels] = useState([]);
    const [filteredHotels, setFilteredHotels] = useState([]);
    const [loading, setloading] = useState(false);
    const [slideshow, setSlideshow] = useState(false);
    const [festiveImg, setFestiveImg] = useState('');

    // Fetch all hotels from the backend
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const response = await fetch('https://trioserver.onrender.com/api/v1/users/getAllHotels');
                const data = await response.json();
                if (data.success) {
                    console.log('rani rani', data.hotels)
                    setAllHotels(data.hotels); // Assuming backend sends { success: true, hotels: [...] }
                    setFilteredHotels(data.hotels);
                }
            } catch (error) {
                console.log('Error fetching hotels:', error);
            }
        };

        fetchHotels();
    }, []);

    // Filter hotels based on the search query
    useEffect(() => {
        if (query.trim()) {
          const results = allHotels.filter(
            (hotel) =>
              hotel.hotelName.toLowerCase().includes(query.toLowerCase()) ||
              hotel.city.toLowerCase().includes(query.toLowerCase())
          );
          setFilteredHotels(results);
        } else {
          setFilteredHotels([]); // Clear filteredHotels when no query
        }
      }, [query]);

    const fetchAllHotelsCity = async () => {
        setloading(true);
        setSlideshow(false)
        await fetch("https://trioserver.onrender.com/api/v1/users/getAllHotelsCity", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(async (data) => {
                try {
                    console.log(data.data);
                    if (data) {
                        setAllHotelsCity(data.data);
                        const timestamp = new Date().getTime();
                        await AsyncStorage.setItem('allHotel', JSON.stringify({ data: data.data, timestamp: timestamp }));
                        setSlideshow(true);
                    }
                } catch (error) {
                    console.log("Error in fetching Hotel", error);
                    alert(data)//Show the proper error with the help of message and received and use some code eg. 101 to identify the error
                }
                finally {
                    setloading(false)
                }
            })
    }

    const isDataExpired = (timestamp, expirationTime) => {
        const currentTime = new Date().getTime();
        return (currentTime - timestamp) > expirationTime;
    };

    // Function to get stored data from AsyncStorage with expiration check
    const getStoredData = async () => {
        try {
            const storedDataString = await AsyncStorage.getItem('allHotel');
            if (storedDataString) {
                const storedData = JSON.parse(storedDataString);
                const { data, timestamp } = storedData;
                // Set expiration time (e.g., 1 hour)
                const expirationTime = 900000; // 3600000 milliseconds = 1 hour
                // Check if data is expired
                if (!isDataExpired(timestamp, expirationTime)) {
                    // Data is not expired, set it in state
                    setAllHotelsCity(data);
                    setSlideshow(true);
                } else {
                    // Data is expired, fetch fresh data
                    fetchAllHotelsCity();
                }
            } else {
                // No stored data found, fetch fresh data
                fetchAllHotelsCity();
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    };

    useEffect(() => {
        // Load stored data when component mounts
        getStoredData();
    }, []);

    const cityImages = {
        "Kolkata": require('../../assets/Kolkata.jpg'),
        "Bhubneshwar": require('../../assets/Bhubaneshwar.jpg'),
        "Puri": require('../../assets/Puri.jpg'),
        "Delhi": require('../../assets/Delhi.png'),
        "Mumbai": require('../../assets/Kolkata.jpg'),
        "Mayong": require('../../assets/Kolkata.jpg'),
    };


    const renderMarque = ({ item }) => {
        const cityImage = cityImages[item._id]; // Get the image for the city

        return (
            <View style={styles.cloud}>
                <TouchableOpacity
                    onPress={() => {
                        props.navigation.push("Hotel", { city: item._id, coupleStay: false, familyStay: true });
                    }}
                >
                    <View style={styles.marque}>
                        {cityImage ? (
                            <View style={styles.cityContainer}>
                                <Image source={cityImage} style={styles.cityImage} />
                                <Text style={styles.itemName}>{item._id}</Text>
                            </View>
                        ) : (
                            <View style={styles.cityContainer}>
                                <View style={styles.defaultImage}>
                                    <Text style={styles.defaultText}>{item._id[0]}</Text>
                                </View>
                                <Text style={styles.itemName}>{item._id}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    useEffect(() => {
        const fetchOffersData = async () => {
            try {
                const response2 = await axios.get('https://trioserver.onrender.com/api/v1/users/hotel-dashboard-images');
                setFestiveImg(response2.data[0]?.imageUrl)
            } catch (error) {
                console.error('Error fetching offers data', error);
            }
        };

        fetchOffersData();
    }, []);

    const renderHotel = ({ item }) => (
        <TouchableOpacity
            style={styles.hotelCard}
            onPress={()=>{props.navigation.push("HotelCart", {hotel: item, coupleStay: false, familyStay: true})}}
        >
            <Image source={{ uri: item.hotelPhoto }} style={styles.hotelImage} />
            <View style={styles.hotelInfo}>
                <Text style={styles.hotelName}>{item.hotelName}</Text>
                <Text style={styles.hotelCity}>{item.city}</Text>
                <Text style={styles.hotelPrice}>Price: ₹{item.price}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <HotelLoader />
        );
    }

    return (
        <ScrollView style={{ backgroundColor: '#68095f' }}>
               <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
            <View style={{ height: height / 2 }}>
                {festiveImg && (
                    <Image
                        source={{ uri: festiveImg.replace('http://', 'https://') }}
                        style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                    />
                )}
                <View style={styles.container2}>
                    <TextInput
                        style={styles.searchbar}
                        value={query}
                        onChangeText={setQuery}
                    />
                    <Icon name="magnifying-glass" size={20} color="black" style={styles.searchicon} />
                </View>
            </View>

            {query.trim() && (
                <FlatList
                    data={filteredHotels}
                    renderItem={renderHotel}
                    keyExtractor={(item) => item._id}
                    showsHorizontalScrollIndicator={false}
                />
            )}

            <FlatList
                horizontal
                data={allHotelsCity}
                renderItem={renderMarque}
                bounces={false}
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
            />

            <View style={styles.blockContainer}>

                <TouchableOpacity
                    onPress={() => { props.navigation.push("CityNames", { flatStay: false, coupleStay: true, familyStay: false }) }}
                    style={[styles.box, { width: width / 3, height: width / 3 }]}>
                    <Image source={require("../../assets/couplestay.png")} style={{ width: width / 3, height: width / 3, borderRadius: 20 }} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'white' }}>Couple's Stay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => { props.navigation.push("CityNames", { flatStay: false, coupleStay: false, familyStay: true }) }}
                    style={[styles.box, { width: width / 3, height: width / 3 }]}>
                    <Image source={require("../../assets/familystay.png")} style={{ width: width / 3, height: width / 3, borderRadius: 20 }} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'white' }}>Family Stay</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity style={{ width: width / 3, height: width / 3 }}>
                    <Image source={require("../../assets/Login.png")} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700' }}>Personal Stay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ width: width / 3, height: width / 3 }}>
                    <Image source={require("../../assets/Login.png")} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700' }}>Wedding Stay</Text>
                </TouchableOpacity> */}
                {/* <TouchableOpacity
                    onPress={()=>{props.navigation.push("CityNames", { flatStay: true, coupleStay: false, familyStay: false })}}
                    style={[styles.box, { width: width / 3, height: width / 3 }]}>
                    <Image source={require("../../assets/Hotel.png")} style={{ width: width / 3, height: width / 3 }} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'black' }}>Flat's Stay</Text>
                </TouchableOpacity> */}

            </View>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    slideshow: {
        position: 'absolute',
        zIndex: -1,
    },
    carousel: {
        width,
        height: height / 2.2,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
    },
    container1: {
        padding: 10,
    },
    searchbar: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 6,
        color: 'black'
    },
    searchicon: {
        position: 'absolute',
        right: '25%'
    },
    container2: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        top: 25,
        left: '10%'
    },
    blockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        padding: 10,
        marginTop: 25
    },
    box: {
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        marginHorizontal: 25
    },
    marque: {
        alignItems: 'center',
        marginHorizontal: 10
    },
    cityContainer: {
        alignItems: 'center',
    },
    cityImage: {
        width: 80,
        height: 80,
        borderRadius: 40, // Makes the image circular
        marginBottom: 8,
    },
    defaultImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#9f0d91',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    defaultText: {
        fontSize: 24,
        color: '#fff',
    },
    itemName: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
    },
    hotelCard: {
        flexDirection: 'row',
        margin: 10,
        backgroundColor: '#9f0d91',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 3,
      },
      hotelImage: {
        width: 100,
        height: 100,
      },
      hotelInfo: {
        padding: 10,
        flex: 1,
        justifyContent: 'center',
      },
      hotelName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffff00',
      },
      hotelCity: {
        color: 'white',
      },
      hotelPrice: {
        color: 'white',
        fontWeight: 'bold',
      },
})

export default HotelDashboard
