import React, { useEffect, useState } from 'react'
import HotelLoader from './HotelLoader';
import { FlatList, TouchableOpacity, View, Text, StyleSheet } from 'react-native';

function CityNames(props) {

    const { flatStay, coupleStay, familyStay } = props.route.params

    const [query, setQuery] = useState('');
    const [allCity, setAllCity] = useState([]);
    const [searchedCity, setSearchedCity] = useState([]);
    const [loading, setloading] = useState(false);
    const [h1, setH1] = useState('');

    const fetchAllHotels = async () => {
        setloading(true);
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
                        setAllCity(data.data);
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

    const fetchAllFlats = async () => {
        setloading(true);
        await fetch("https://trioserver.onrender.com/api/v1/users/getAllFlats", {
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
                        setAllCity(data.data);
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

    useEffect(() => {
        if (!flatStay) {
            if(coupleStay){
               fetchAllHotels();
               setH1("Couple's Stay");
            }
            else if(familyStay){
                fetchAllHotels();
                setH1("Family Stay");
            }
        }
        else {
            fetchAllFlats();
            setH1("Flat Stay");
        }
    }, []);

    const renderHotelsCity = ({ item, index }) => (
        <TouchableOpacity onPress={()=>{props.navigation.push("Hotel", { city: item._id, coupleStay: coupleStay, familyStay: familyStay })}}>
            <View style={styles.box}>
                <Text style={{color: 'black', fontSize: 16, textAlign: 'center'}}>{item._id}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderFlatsCity = ({ item, index }) => (
        <TouchableOpacity onPress={()=>{props.navigation.push("Flat", { city: item._id })}}>
            <View style={styles.box}>
                <Text style={{color: 'black', fontSize: 20, textAlign: 'center'}}>{item._id}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <HotelLoader />
        );
    }

    return (
        <View style={{padding:10}}>
            <Text style={styles.h1}>{h1}</Text>
            {
                flatStay ? (
                    <View>
                        <FlatList
                            data={allCity}
                            renderItem={renderFlatsCity}
                            keyExtractor={(item, index) => index.toString()}
                        />
                    </View>
                ) :
                    (
                        <View>
                            <FlatList
                                data={allCity}
                                renderItem={renderHotelsCity}
                                keyExtractor={(item, index) => index.toString()}
                            />
                        </View>
                    )
            }
        </View>
    )
}

const styles = StyleSheet.create({
    h1: {
        color: 'black',
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        padding: 10
    },
    box: {
        backgroundColor: 'skyblue',
        padding: 10,
        borderRadius: 15,
        marginTop: 10
    }
})

export default CityNames
