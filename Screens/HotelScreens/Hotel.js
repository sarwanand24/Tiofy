import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, Image, Dimensions, StyleSheet, TouchableOpacity } from 'react-native'
import HotelLoader from './HotelLoader';

const { width, height } = Dimensions.get("window");

function Hotel(props) {

    const { city, coupleStay, familyStay } = props.route.params

    const [loading, setloading] = useState(false);
    const [allHotels, setAllHotels] = useState([]);
    const [state, setState] = useState({
        msg: false,
        title: ''
    });

    useEffect(() => {
        if (coupleStay) {
            fetchAllCoupleHotels();
            setState(prevState => ({ ...prevState, title: 'Couples' }));
        }
        else if (familyStay) {
            fetchAllFamilyHotels();
            setState(prevState => ({ ...prevState, title: 'Families' }));
        }
        else {
            fetchAllHotels()
        }
    }, [])

    const fetchAllHotels = async () => {
        setloading(true);
        await fetch("https://trioserver.onrender.com/api/v1/users/get-all-hotels-by-city", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "city": city
            })
        })
            .then(res => res.json())
            .then(async (data) => {
                try {
                    console.log(data.data);
                    if (data.data.check?.noHotel) {
                        setState(prevState => ({ ...prevState, msg: true }));
                    }
                    else {
                        setAllHotels(data.data);
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

    const fetchAllCoupleHotels = async () => {
        setloading(true);
        await fetch("https://trioserver.onrender.com/api/v1/users/get-all-couple-hotels", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "city": city
            })
        })
            .then(res => res.json())
            .then(async (data) => {
                try {
                    console.log(data.data);
                    if (data.data.check?.noHotel) {
                        setState(prevState => ({ ...prevState, msg: true }));
                    }
                    else {
                        setAllHotels(data.data);
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

    const fetchAllFamilyHotels = async () => {
        setloading(true);
        await fetch("https://trioserver.onrender.com/api/v1/users/get-all-family-hotels", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "city": city
            })
        })
            .then(res => res.json())
            .then(async (data) => {
                try {
                    console.log(data.data);
                    if (data.data.check?.noHotel) {
                        setState(prevState => ({ ...prevState, msg: true }));
                    }
                    else {
                        setAllHotels(data.data);
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

    const renderHotels = ({ item, index }) => (
        <TouchableOpacity 
        key={index}
        onPress={()=>{props.navigation.push("HotelCart", {hotel: item, coupleStay, familyStay})}}
        style={styles.container}>
            <Image
                source={{ uri: item.hotelPhoto }}
                style={{ width: width - 30, height: 200, borderRadius: 20 }}
                resizeMode="cover"
            />
            <Text style={{ fontSize: 25, color: 'white', fontWeight: '700', marginLeft: 10, marginTop: 5 }}>{item.hotelName}</Text>
            <Text style={{ fontSize: 16, color: 'white', fontWeight: '600', marginLeft: 10, width: width / 2 }}>{item.address}</Text>
            <Text style={{ fontSize: 16, color: 'white', fontWeight: '600', marginLeft: 10, width: width / 2 }}>Rs {item.price}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <HotelLoader />
        );
    }

    return (
        <View style={{ flex: 1, padding: 15, marginBottom: 30, backgroundColor:'#68095f' }}>
            <Text style={{ fontSize: 20, color: '#ffff00', fontWeight: '800', textAlign: 'center', padding: 10 }}>{city}</Text>
            {state.msg && (
                <View>
                    <Text
                        style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'white' }}>
                       Sorry, It's Not You It's Us!
                    </Text>
                    <Text
                        style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: 'white' }}>
                        We Don't Serve {state.title} In this City
                    </Text>
                </View>
            )}
            <FlatList
                data={allHotels}
                renderItem={renderHotels}
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#9f0d91",
        borderRadius: 20,
        marginTop: 10,
        paddingBottom: 15
    }
})

export default Hotel
