import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, Image, StyleSheet, Dimensions, StatusBar } from 'react-native'
import HotelLoader from './HotelLoader';

const { width, height } = Dimensions.get("window");

function Flat(props) {

    const { city } = props.route.params

    const [loading, setloading] = useState(false);
    const [allFlats, setAllFlats] = useState([]);


    useEffect(() => {
       fetchAllFlats()
    }, [])

    const fetchAllFlats = async () => {
        setloading(true);
        await fetch("https://trioserver.onrender.com/api/v1/users/get-all-flats-by-city", {
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
                    if (data) {
                        setAllFlats(data.data);
                    }
                } catch (error) {
                    console.log("Error in fetching Flat", error);
                    alert(data)//Show the proper error with the help of message and received and use some code eg. 101 to identify the error
                }
                finally {
                    setloading(false)
                }
            })
    }

    const renderFlats = ({ item, index }) => (
        <View style={styles.container}>
        <Image
            source={{ uri: item.flatPhoto }}
            style={{ width: width - 30, height: width, borderRadius: 20 }}
            resizeMode="cover"
        />
        <Text style={{ fontSize: 25, color: 'black', fontWeight: '700', marginLeft: 10, marginTop: 5 }}>{item.flatName}</Text>
        <Text style={{ fontSize: 16, color: 'black', fontWeight: '600', marginLeft: 10, width: width / 2 }}>{item.address}</Text>
        <Text style={{ fontSize: 16, color: 'black', fontWeight: '600', marginLeft: 10, width: width / 2 }}>Rs {item.price}</Text>
    </View>
    );

    if (loading) {
        return (
            <HotelLoader />
        );
    }

    return (
        <View style={{ padding: 15, marginBottom: 30 }}>
               <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
            <Text style={{ fontSize: 20, color: 'black', fontWeight: '800', textAlign: 'center', padding: 10 }}>{city}</Text>
            <FlatList
                data={allFlats}
                renderItem={renderFlats}
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "pink",
        borderRadius: 20,
        marginTop: 10,
        paddingBottom: 15
    }
})

export default Flat
