import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import AsyncStorage from '@react-native-async-storage/async-storage';

import Loading from '../Loading';

const { width, height } = Dimensions.get('window');

function Restaurant(props) {

    const {restro} = props.route.params;

    console.log('Restroooo', restro);
    

    const [query, setQuery] = useState('');
    const [cartBtn, setCartBtn] = useState(false);
    const [activeVeg, setActiveVeg] = useState(true);
    const [activeNonVeg, setActiveNonVeg] = useState(false);
    const [loading, setloading] = useState(false);

    //FoodItems Variable
    const [vegfoods, setvegFoods] = useState([]);
    const [nonvegfoods, setnonvegFoods] = useState([]);
    const [selectedFoods, setSelectedFoods] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalRestroAmount, setTotalRestroAmount] = useState(0);
    const [totalItem, setTotalItem] = useState(0);
    const [veg, setVeg] = useState([]);
    const [nonveg, setNonVeg] = useState([]);
    const [fetchveg, setfetchVeg] = useState([]);
    const [fetchnonveg, setfetchNonVeg] = useState([]);

    console.log("Veg Foods", vegfoods);
    console.log("Non-Veg Foods", nonvegfoods);
    console.log("Selected Foods", selectedFoods);
    console.log("Total Amount", totalAmount);
    console.log("Total Item", totalItem);

    const handleSearch = () => {
        if (query.trim() !== '') {
            const lowerCaseQuery = query.toLowerCase();
            const Vegindex = veg.findIndex(food => food.name.toLowerCase().includes(lowerCaseQuery));
            if (Vegindex !== -1) {
                const searchedFood = veg[Vegindex];
                const remainingFoods = [...veg.slice(0, Vegindex), ...veg.slice(Vegindex + 1)];
                const searchedFoodCount = vegfoods[Vegindex];
                const remainingFoodCount = [...vegfoods.slice(0, Vegindex), ...vegfoods.slice(Vegindex + 1)];
                setVeg([searchedFood, ...remainingFoods]);
                console.log("before", vegfoods);
                setvegFoods([searchedFoodCount, ...remainingFoodCount]);
            }
            const NonVegindex = nonveg.findIndex(food => food.name.toLowerCase().includes(lowerCaseQuery));
            if (NonVegindex !== -1) {
                const searchedFood = nonveg[NonVegindex];
                const remainingFoods = [...nonveg.slice(0, NonVegindex), ...nonveg.slice(NonVegindex + 1)];
                setNonVeg([searchedFood, ...remainingFoods]);
                const searchedFoodCount = nonvegfoods[NonVegindex];
                const remainingFoodCount = [...nonvegfoods.slice(0, NonVegindex), ...nonvegfoods.slice(NonVegindex + 1)];
                setnonvegFoods([searchedFoodCount, ...remainingFoodCount]);
            }
        }
    };

    useEffect(() => {
        if (fetchveg?.length > 0) {
            setvegFoods(Array(veg.length).fill(0))
        }
        if (fetchnonveg?.length > 0) {
            setnonvegFoods(Array(nonveg.length).fill(0))
        }
    }, [fetchveg, fetchnonveg])

    useEffect(() => {
        setVeg(restro.vegFoods);
        setfetchVeg(restro.vegFoods);
        setNonVeg(restro.nonvegFoods);
        setfetchNonVeg(restro.nonvegFoods)
    }, [])

    const VegincrementCounter = (id) => {
        const index = veg.findIndex(food => food._id === id);
        const newQuantities = [...vegfoods];
        newQuantities[index] += 1;
        setvegFoods(newQuantities);

        console.log("FoodName", veg[index].name);
        console.log("FoodQuantity", newQuantities[index]);
        const newFood = {
            name: veg[index].name,
            quantity: newQuantities[index],
            price: veg[index].tiofyPrice * newQuantities[index],
            sellPrice: veg[index].tiofyPrice,
            restroPrice: veg[index].price,
        };
        const existingFoodIndex = selectedFoods.findIndex(food => food.name === newFood.name);
        if (existingFoodIndex !== -1) {
            const updatedFoods = [...selectedFoods];
            updatedFoods[existingFoodIndex].quantity = newFood.quantity;
            updatedFoods[existingFoodIndex].price = newFood.price;
            updatedFoods[existingFoodIndex].restroPrice = newFood.restroPrice;
            setSelectedFoods(updatedFoods);
        } else {
            setSelectedFoods([...selectedFoods, newFood]);
        }
        setCartBtn(true);
        var amount = totalAmount;
        amount += veg[index].tiofyPrice;
        setTotalAmount(amount);
        var amount2 = totalRestroAmount;
        amount2 += veg[index].price;
        setTotalRestroAmount(amount2);
        setTotalItem(totalItem + 1)
    };

    const VegdecrementCounter = (id) => {
        const index = veg.findIndex(food => food._id === id);
        const newQuantities = [...vegfoods];
        
        if (newQuantities[index] > 0) {
            newQuantities[index] -= 1;
            setvegFoods(newQuantities);
            console.log("FoodName", veg[index].name);
            console.log("FoodQuantity", newQuantities[index]);
            const newFood = {
                name: veg[index].name,
                quantity: newQuantities[index],
                price: veg[index].tiofyPrice * newQuantities[index],
                sellPrice: veg[index].tiofyPrice,
                restroPrice: veg[index].price,
            };
            const existingFoodIndex = selectedFoods.findIndex(food => food.name === newFood.name);
            const updatedFoods = [...selectedFoods];
            updatedFoods[existingFoodIndex].quantity = newFood.quantity;
            updatedFoods[existingFoodIndex].price = newFood.price;
            updatedFoods[existingFoodIndex].restroPrice = newFood.restroPrice;
            const updatedFoods2 = selectedFoods.filter(food => food.quantity !== 0);  //Do this while sending
            setSelectedFoods(updatedFoods2);
            const zeroFood = selectedFoods.filter(food => food.quantity !== 0);
            console.log("Zero Food", zeroFood);
            if (zeroFood.length == '') {
                setCartBtn(false)
            }
            var amount = totalAmount;
            amount -= veg[index].tiofyPrice;
            setTotalAmount(amount);
            setTotalItem(totalItem - 1)
            var amount2 = totalRestroAmount;
            amount2 += veg[index].price;
            setTotalRestroAmount(amount2);
        }
    };

    const VegfoodItems = ({ item, index }) => (
        <View
            style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}
        >
            <View>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodName}>Rs {item.tiofyPrice}</Text>
            </View>
            <View>
            <Image
  source={{
    uri: item.image ? item.image.replace("http://", "https://") : null
  }}
  style={styles.foodImg}
/>
                <View style={styles.itemIncDec}>
                    <TouchableOpacity onPress={() => { VegdecrementCounter(item._id) }}>
                        <Icon name="minus" size={24} color="black" style={styles.IncDecicon} />
                    </TouchableOpacity>
                    <Text style={{ color: 'black', fontSize: 16, fontWeight: '700' }}>{vegfoods[index]}</Text>
                    <TouchableOpacity onPress={() => { VegincrementCounter(item._id) }}>
                        <Icon name="plus" size={24} color="black" style={styles.IncDecicon} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const NonVegincrementCounter = (id) => {
        const index = nonveg.findIndex(food => food._id === id);
        const newQuantities = [...nonvegfoods];
        newQuantities[index] += 1;
        setnonvegFoods(newQuantities);

        console.log("FoodName", nonveg[index].name);
        console.log("FoodQuantity", newQuantities[index]);
        const newFood = {
            name: nonveg[index].name,
            quantity: newQuantities[index],
            price: nonveg[index].tiofyPrice * newQuantities[index],
            sellPrice: nonveg[index].tiofyPrice,
            restroPrice: nonveg[index].price,
        };
        const existingFoodIndex = selectedFoods.findIndex(food => food.name === newFood.name);
        if (existingFoodIndex !== -1) {
            const updatedFoods = [...selectedFoods];
            updatedFoods[existingFoodIndex].quantity = newFood.quantity;
            updatedFoods[existingFoodIndex].price = newFood.price;
            updatedFoods[existingFoodIndex].restroPrice = newFood.restroPrice;
            setSelectedFoods(updatedFoods);
        } else {
            setSelectedFoods([...selectedFoods, newFood]);
        }
        setCartBtn(true);
        var amount = totalAmount;
        amount += nonveg[index].tiofyPrice;
        setTotalAmount(amount);
        setTotalItem(totalItem + 1)
        var amount2 = totalRestroAmount;
        amount2 += veg[index].price;
        setTotalRestroAmount(amount2);
    };

    const NonVegdecrementCounter = (id) => {
        const index = nonveg.findIndex(food => food._id === id);
        const newQuantities = [...nonvegfoods];

        if (newQuantities[index] > 0) {
            newQuantities[index] -= 1;
            setnonvegFoods(newQuantities);

            console.log("FoodName", nonveg[index].name);
            console.log("FoodQuantity", newQuantities[index]);
            const newFood = {
                name: nonveg[index].name,
                quantity: newQuantities[index],
                price: nonveg[index].tiofyPrice * newQuantities[index],
                sellPrice: nonveg[index].tiofyPrice,
                restroPrice: nonveg[index].price,
            };
            const existingFoodIndex = selectedFoods.findIndex(food => food.name === newFood.name);
            const updatedFoods = [...selectedFoods];
            updatedFoods[existingFoodIndex].quantity = newFood.quantity;
            updatedFoods[existingFoodIndex].price = newFood.price;
            updatedFoods[existingFoodIndex].restroPrice = newFood.restroPrice;
            const updatedFoods2 = selectedFoods.filter(food => food.quantity !== 0);
            setSelectedFoods(updatedFoods2);
            const zeroFood = selectedFoods.filter(food => food.quantity !== 0);
            console.log("Zero Food", zeroFood);
            if (zeroFood.length == '') {
                setCartBtn(false)
            }
            var amount = totalAmount;
            amount -= nonveg[index].tiofyPrice;
            setTotalAmount(amount);
            setTotalItem(totalItem - 1)
            var amount2 = totalRestroAmount;
            amount2 += veg[index].price;
            setTotalRestroAmount(amount2);
        }
    };

    const NonVegfoodItems = ({ item, index }) => (
        <View
            style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}
        >
            <View>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodName}>Rs {item.tiofyPrice}</Text>
            </View>
            <View>
            <Image
  source={{
    uri: item.image ? item.image.replace("http://", "https://") : null
  }}
  style={styles.foodImg}
/>
                <View style={styles.itemIncDec}>
                    <TouchableOpacity onPress={() => { NonVegdecrementCounter(item._id) }}>
                        <Icon name="minus" size={24} color="black" style={styles.IncDecicon} />
                    </TouchableOpacity>
                    <Text style={{ color: 'black', fontSize: 16, fontWeight: '700' }}>{nonvegfoods[index]}</Text>
                    <TouchableOpacity onPress={() => { NonVegincrementCounter(item._id) }}>
                        <Icon name="plus" size={24} color="black" style={styles.IncDecicon} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

     // Conversion functions
     const convertMetersToKilometers = (meters) => (meters / 1000).toFixed(2);
     const convertSecondsToMinutes = (seconds) => (seconds / 60).toFixed(0);
 
     // Converted values
     const distanceInKm = convertMetersToKilometers(restro.distance);
     const durationInMins = convertSecondsToMinutes(restro.duration);

    if (loading) {
        return (
            <Loading />
        );
    }

    return (
        <View>

<View style={styles.header}>
<Image
  source={{
    uri: restro.restaurantPhoto
      ? restro.restaurantPhoto.replace("http://", "https://")
      : null
  }}
  style={styles.headerImage}
/>

                <View style={styles.detailsContainer}>
                    <Text style={[styles.headerText, { textAlign: 'center' }]}>
                        {restro.restaurantName}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <Icon name="star" size={20} color="#FFD700" />
                        <Text style={styles.headerDetail}>{restro.rating}</Text>
                    </View>
                    <Text style={styles.headerDetail}>
                        Distance: {distanceInKm} km
                    </Text>
                    <Text style={styles.headerDetail}>
                        Duration: {durationInMins} mins
                    </Text>
                    <Text style={styles.headerDetail}>
                        Address: {restro.address}
                    </Text>
                </View>
            </View>

            {cartBtn && (
                <TouchableOpacity
                    style={[styles.cartBtn, { position: 'absolute', zIndex: 100, top: height / 1.2 }]}
                    onPress={() => {
                        props.navigation.push("FoodCart", { restroName: restro.restaurantName, totalAmount, totalItem, selectedFoods, restroId: restro._id, deviceToken: restro.deviceToken, totalRestroAmount, distance: distanceInKm})
                    }}>
                    <Text style={{ color: 'black', fontWeight: '700', fontSize: 16 }}>{totalItem} Items added</Text>
                    <Text style={{ color: 'black', fontWeight: '700', fontSize: 16 }}>View Cart
                        <Icon name="arrow-right" size={15} color="black" />
                    </Text>
                </TouchableOpacity>)}

            <ScrollView>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchbar}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <Icon name="magnifying-glass" size={24} color="black" style={styles.searchicon} />
                </View>

                <View style={styles.menu}>
                    <TouchableOpacity
                        style={[styles.menuBtn, activeVeg ? { backgroundColor: 'lightgreen' } : { backgroundColor: 'lightblue' }]}
                        onPress={() => {
                            setActiveVeg(true);
                            setActiveNonVeg(false);
                        }}>
                        <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>Veg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.menuBtn, activeNonVeg ? { backgroundColor: 'lightgreen' } : { backgroundColor: 'lightblue' }]}
                        onPress={() => {
                            setActiveNonVeg(true);
                            setActiveVeg(false);
                        }}>
                        <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>Non-Veg</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ marginBottom: height / 3, paddingBottom:100 }}>
                    {veg?.length > 0 && activeVeg && (
                        <FlatList
                            data={veg}
                            renderItem={VegfoodItems}
                            bounces={false}
                            keyExtractor={(item, index) => index.toString()}
                            style={{ marginTop: 10 }}
                        />
                    )}
                    {nonveg?.length > 0 && activeNonVeg && (
                        <FlatList
                            data={nonveg}
                            renderItem={NonVegfoodItems}
                            bounces={false}
                            keyExtractor={(item, index) => index.toString()}
                            style={{ marginTop: 10 }}
                        />
                    )}
                </View>

            </ScrollView>

        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        position: 'relative',
        width: width,
        height: 190, // Adjust height as needed
    },
    headerImage: {
        width: width,
        height: '100%',
        resizeMode: 'cover',
    },
    detailsContainer: {
        position: 'absolute',
        bottom: 0,
        width: width,
        padding: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerText: {
        fontSize: 25,
        color: 'white',
        fontWeight: '700',
        marginBottom: 5,
    },
    headerDetail: {
        fontSize: 16,
        color: 'white',
        fontWeight: '400',
        marginVertical: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    searchbar: {
        width: width / 1.2,
        backgroundColor: 'lightgrey',
        borderRadius: 20,
        padding: 13
    },
    searchicon: {
        position: 'absolute',
        right: width / 8
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginLeft: width / 12
    },
    foodImg: {
        width: width / 2,
        height: width / 2,
        borderRadius: 20
    },
    foodName: {
        color: 'black',
        fontSize: 18,
        fontWeight: '700'
    },
    itemIncDec: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: 'lightblue',
        borderRadius: 13,
        width: width / 2.5,
        position: 'absolute',
        bottom: -15,
        left: 15
    },
    cartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'lightblue',
        borderRadius: 20,
        padding: 15,
        width: width / 1.3,
        marginLeft: 3 * width / 26
    },
    menu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    menuBtn: {
        padding: 20,
        marginTop: 10,
        borderRadius: 20
    }
})

export default Restaurant
