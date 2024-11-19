import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
    Image
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import AsyncStorage from '@react-native-async-storage/async-storage';

import carousel from './images/Carousel';
import HotelLoader from './HotelLoader';

const { width, height } = Dimensions.get('window');

function HotelDashboard(props) {

    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const [query, setQuery] = useState('');
    const [allHotels, setAllHotels] = useState([]);
    const [searchedHotels, setSearchedHotels] = useState([]);
    const [loading, setloading] = useState(false);
    const [slideshow, setSlideshow] = useState(false);


    useEffect(() => {
        if (slideshow) {
            const interval = setInterval(() => {
                const nextIndex =
                    currentIndex === carousel.length - 1 ? 0 : currentIndex + 1;
                setCurrentIndex(nextIndex);
                flatListRef.current.scrollToIndex({
                    animated: true,
                    index: nextIndex,
                });
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [currentIndex, slideshow]);

    const fetchAllHotels = async () => {
        setloading(true);
        setSlideshow(false)
        await fetch("https://trioserver.onrender.com/api/v1/users/getAllHotels", {
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
                        setAllHotels(data.data);
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
                    setAllHotels(data);
                    setSlideshow(true);
                } else {
                    // Data is expired, fetch fresh data
                    fetchAllHotels();
                }
            } else {
                // No stored data found, fetch fresh data
                fetchAllHotels();
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    };

    useEffect(() => {
        // Load stored data when component mounts
        getStoredData();
    }, []);

    const renderItem = ({ item, index }) => (
        <Image
            source={item.image}
            style={styles.carousel}
            resizeMode="cover"
        />
    );

    const renderDot = (index) => (
        <TouchableOpacity
            key={index}
            onPress={() => {
                flatListRef.current.scrollToIndex({ animated: true, index });
                setCurrentIndex(index);
            }}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
        />
    );

    // const bgColors = ['violet', 'skyblue', 'pink', 'lightgreen', 'violet', 'orange', 'pink', 'yellow', 'red', 'blue', 'green', 'violet', 'orange', 'pink'];
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const renderMarque = ({ item }) => {
        const randomBgColor = getRandomColor();
    
        return (
            <TouchableOpacity onPress={() => { props.navigation.push("Hotel", { city: item._id, coupleStay: false, familyStay: false }) }}>
                <View style={[styles.marque, { backgroundColor: randomBgColor }]}>
                    <Text style={styles.itemName}>{item._id}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const handleSearch = async () => {
     //handle search function if any
    }

    if (loading) {
        return (
            <HotelLoader />
        );
    }

    return (
        <ScrollView style={{ backgroundColor: 'white' }}>
            <View style={{height: height/2}}>
                <View style={styles.slideshow}>
                    <FlatList
                        ref={flatListRef}
                        horizontal
                        data={carousel}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(event) => {
                            const slideIndex = Math.ceil(
                                event.nativeEvent.contentOffset.x / width
                            );
                            setCurrentIndex(slideIndex);
                        }}
                        onScrollToIndexFailed={(info) => {
                            console.warn('onScrollToIndexFailed info:', info);
                        }}
                    />
                    <View style={styles.dotsContainer}>
                        {carousel.map((_, index) => renderDot(index))}
                    </View>
                </View>

                <View style={styles.container2}>
                    <TextInput
                        style={styles.searchbar}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <Icon name="magnifying-glass" size={24} color="black" style={styles.searchicon} />
                </View>
            </View>

            <FlatList
                horizontal
                data={allHotels}
                renderItem={renderMarque}
                bounces={false}
                keyExtractor={(item, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
            />

            <View style={styles.blockContainer}>
                <TouchableOpacity
                    onPress={()=>{props.navigation.push("CityNames", { flatStay: false, coupleStay: true, familyStay: false })}}
                    style={[styles.box, { width: width / 3, height: width / 3}]}>
                    <Image source={require("../../assets/Hotel.png")} style={{ width: width / 3, height: width / 3 }} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'black' }}>Couple's Stay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={()=>{props.navigation.push("CityNames", { flatStay: false, coupleStay: false, familyStay: true })}}
                    style={[styles.box, { width: width / 3, height: width / 3 }]}>
                    <Image source={require("../../assets/Hotel.png")} style={{ width: width / 3, height: width / 3 }} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'black' }}>Family Stay</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity style={{ width: width / 3, height: width / 3 }}>
                    <Image source={require("../../assets/Login.png")} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700' }}>Personal Stay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ width: width / 3, height: width / 3 }}>
                    <Image source={require("../../assets/Login.png")} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700' }}>Wedding Stay</Text>
                </TouchableOpacity> */}
                <TouchableOpacity
                    onPress={()=>{props.navigation.push("CityNames", { flatStay: true, coupleStay: false, familyStay: false })}}
                    style={[styles.box, { width: width / 3, height: width / 3 }]}>
                    <Image source={require("../../assets/Hotel.png")} style={{ width: width / 3, height: width / 3 }} />
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'black' }}>Flat's Stay</Text>
                </TouchableOpacity>
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
        width: width / 1.3,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 13
    },
    searchicon: {
        position: 'absolute',
        right: width / 15
    },
    container2: {
        flexDirection: 'row',
        alignItems: 'center',
        width: width / 1.3,
        position: 'absolute',
        top: 70,
        left: (width * 3) / 26
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        width,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'white',
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: 'red',
    },
    marque: {
        width: width / 5,
        height: width / 5,
        borderRadius: 50,
        marginHorizontal: 20,
        justifyContent: 'center'
    },
    itemName: {
        color: 'white',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '700'
    },
    blockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        padding: 10,
    },
    box: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        marginHorizontal: 25
    }
})

export default HotelDashboard
