import React, { useEffect, useState } from 'react'
import HotelLoader from './HotelLoader';
import { FlatList, TouchableOpacity, View, Text, StyleSheet, TextInput, StatusBar } from 'react-native';

function CityNames(props) {
    const { flatStay, coupleStay, familyStay } = props.route.params;

    const [query, setQuery] = useState('');
    const [allCity, setAllCity] = useState([]);
    const [searchedCity, setSearchedCity] = useState([]);
    const [loading, setloading] = useState(false);
    const [h1, setH1] = useState('');

    const fetchAllHotels = async () => {
        setloading(true);
        await fetch("https://trioserver.onrender.com/api/v1/users/getAllHotels", {
            method: "GET",
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(async (data) => {
                try {
                    if (data && data.hotels) {
                        // Get unique cities
                        const uniqueCities = Array.from(
                            new Set(data.hotels.map(hotel => hotel.city))
                        ).map(city => ({ city })); // Convert to desired format
                        setAllCity(uniqueCities);
                        setSearchedCity(uniqueCities);
                    }
                } catch (error) {
                    console.log("Error in fetching hotels:", error);
                    alert(`Error: ${error.message}`);
                } finally {
                    setloading(false);
                }
            });
    };
    

    const fetchAllFlats = async () => {
        setloading(true);
        await fetch("https://trioserver.onrender.com/api/v1/users/getAllFlats", {
            method: "GET",
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(async (data) => {
                try {
                    console.log(data.data);
                    if (data) {
                        setAllCity(data.data);
                        setSearchedCity(data.data); // Initialize the searchedCity list
                    }
                } catch (error) {
                    console.log("Error in fetching Flats", error);
                    alert(`Error 102: ${error.message}`);
                } finally {
                    setloading(false);
                }
            });
    };

    useEffect(() => {
        if (!flatStay) {
            if (coupleStay) {
                fetchAllHotels();
                setH1("Couple's Stay");
            } else if (familyStay) {
                fetchAllHotels();
                setH1("Family Stay");
            }
        } else {
            fetchAllFlats();
            setH1("Flat Stay");
        }
    }, []);

    const handleSearch = (text) => {
        setQuery(text);
        if (text === '') {
            setSearchedCity(allCity); // Reset suggestions when search is cleared
        } else {
            const filteredCities = allCity.filter(city =>
                city.city.toLowerCase().includes(text.toLowerCase())
            );
            setSearchedCity(filteredCities);
        }
    };
    

    const renderCityItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                props.navigation.push(flatStay ? "Flat" : "Hotel", {
                    city: item.city, // Use city instead of _id
                    coupleStay: coupleStay,
                    familyStay: familyStay
                });
            }}
        >
            <View style={styles.box}>
                <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>{item.city}</Text>
            </View>
        </TouchableOpacity>
    );    

    if (loading) {
        return <HotelLoader />;
    }

    return (
        <View style={{ flex: 1, padding: 10, backgroundColor: '#68095f' }}>
               <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
            <Text style={styles.h1}>{h1}</Text>
            {/* Search Bar */}
            <TextInput
                style={styles.searchBar}
                placeholder="Search for a city..."
                placeholderTextColor="#ccc"
                value={query}
                onChangeText={handleSearch}
            />
            {/* City List */}
            <FlatList
                data={searchedCity} // Render the filtered city list
                renderItem={renderCityItem}
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    h1: {
        color: '#ffff00',
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        padding: 10
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        marginVertical: 10,
        color: 'black'
    },
    box: {
        backgroundColor: '#9f0d91',
        padding: 10,
        borderRadius: 15,
        marginTop: 10
    }
});

export default CityNames;
