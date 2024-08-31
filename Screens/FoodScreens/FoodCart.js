import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Text, Image } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
// import { StripeProvider, useStripe, usePlatformPay, PlatformPayButton, PlatformPay } from '@stripe/stripe-react-native';
import socket from '../../utils/Socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import LottieView from 'lottie-react-native';
import Loading from '../Loading';

const { width, height } = Dimensions.get('window');

function FoodCart(props) {

    const { totalAmount, totalItem, selectedFoods, restroName, restroId, deviceToken, totalRestroAmount, distance } = props.route.params;
    console.log(totalAmount, totalItem, selectedFoods, restroName, "rrrrr", distance);

    //Try to use useEffect without dependency at end for setting the values again

    const [foods, setFoods] = useState(selectedFoods.map((item) => item.quantity));
    const [newSelectedFoods, setNewSelectedFoods] = useState(selectedFoods);
    const [newTotalAmount, setNewTotalAmount] = useState(totalAmount);
    const [newTotalRestroAmount, setNewTotalRestroAmount] = useState(totalRestroAmount);
    const [newTotalItem, setNewTotalItem] = useState(totalItem);
    const [deliveryInstructions, setDeliveryInstructions] = useState([false, false, false, false]);
    const [tipSelect, setTipSelect] = useState([false, false, false, false]);
    const [tipAmount, setTipAmount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [googlePay, setGooglePay] = useState(false);
    const [phonePay, setPhonePay] = useState(false);
    const [card, setCard] = useState(false);
    const [cod, setCod] = useState(false);
    const [restroRejected, setRestroRejected] = useState(false);
    const [restroAccepted, setRestroAccepted] = useState(false);
    const [loading, setLoading] = useState(false)
    const [deliveryFee, setDeliveryFee] = useState(distance*10.5);
    const [platformFee, setPlatformFee] = useState(5)

    console.log("New Selected Foods", newSelectedFoods);
    console.log("New Total Amount", newTotalAmount);
    console.log("New Total Restro Amount", newTotalRestroAmount);
    console.log("New Total Item", newTotalItem);

    // useEffect(() => {
    //     const unsubscribe = messaging().onMessage(async remoteMessage => {
    //       alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    //     });

    //     return unsubscribe;
    //   }, []);  //Use it under sockets

    const incrementCounter = (index) => {
        const newQuantities = [...foods];
        newQuantities[index] += 1;
        setFoods(newQuantities);
        console.log("FoodName", newSelectedFoods[index].name);
        console.log("FoodQuantity", newQuantities[index]);
        const newFood = {
            name: selectedFoods[index].name,
            quantity: newQuantities[index],
            price: selectedFoods[index].sellPrice * newQuantities[index],
        };
        const existingFoodIndex = newSelectedFoods.findIndex(food => food.name === newFood.name);
        if (existingFoodIndex !== -1) {
            const updatedFoods = [...newSelectedFoods];
            updatedFoods[existingFoodIndex].quantity = newFood.quantity;
            updatedFoods[existingFoodIndex].price = newFood.price;
            setNewSelectedFoods(updatedFoods);
        }
        var amount = newTotalAmount;
        amount += selectedFoods[index].sellPrice;
        setNewTotalAmount(amount);
        var amount2 = newTotalRestroAmount;
        amount2 += selectedFoods[index].restroPrice;
        setNewTotalRestroAmount(amount2);
        setNewTotalItem(newTotalItem + 1)
    };

    const decrementCounter = (index) => {
        const newQuantities = [...foods];
        if (newQuantities[index] > 0) {
            newQuantities[index] -= 1;
            setFoods(newQuantities);
            console.log("FoodName", selectedFoods[index].name);
            console.log("FoodQuantity", newQuantities[index]);
            const newFood = {
                name: selectedFoods[index].name,
                quantity: newQuantities[index],
                price: selectedFoods[index].sellPrice * newQuantities[index]
            };
            const existingFoodIndex = newSelectedFoods.findIndex(food => food.name === newFood.name);
            const updatedFoods = [...newSelectedFoods];
            updatedFoods[existingFoodIndex].quantity = newFood.quantity;
            updatedFoods[existingFoodIndex].price = newFood.price;
            setNewSelectedFoods(updatedFoods);
            var amount = newTotalAmount;
            amount -= selectedFoods[index].sellPrice;
            setNewTotalAmount(amount);
            var amount2 = newTotalRestroAmount;
            amount2 += selectedFoods[index].restroPrice;
            setNewTotalRestroAmount(amount2);
            setNewTotalItem(newTotalItem - 1)
        }
    };

    //---------------------------Payments Integration---------------------------------------

    // const { initPaymentSheet, presentPaymentSheet } = useStripe();
    // const [loading, setLoading] = useState(false);
    // const {
    //     isPlatformPaySupported,
    //     confirmPlatformPayPayment,
    // } = usePlatformPay();

    // // useEffect(() => {
    // //     (async function () {
    // //         if (!(await isPlatformPaySupported({ googlePay: { testEnv: true } }))) {
    // //             alert('Google Pay is not supported.');
    // //             return;
    // //         }
    // //     })();
    // // }, [])

    // const fetchPaymentSheetParams = async () => {
    //     try {
    //         const response = await fetch('https://trioserver.onrender.com/api/v1/payments/card', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 "amount": newTotalAmount + tipAmount
    //             })
    //         }).then(res => res.json())
    //             .then(async (data) => {
    //                 console.log(data);
    //                 const { paymentIntent, ephemeralKey, customer } = data.data;
    //                 console.log("Log of 3", paymentIntent, ephemeralKey, customer);
    //                 return {
    //                     paymentIntent,
    //                     ephemeralKey,
    //                     customer
    //                 };
    //             })
    //         if (response) {
    //             return response
    //         }
    //     }
    //     catch (error) {
    //         console.log("Error in fetching PaymentInfo", error)
    //     }
    // };

    // const initializePaymentSheet = async () => {
    //     const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();
    //     console.log("Rani", paymentIntent, ephemeralKey, customer);

    //     const { error } = await initPaymentSheet({
    //         merchantDisplayName: "Trio",
    //         customerId: customer,
    //         customerEphemeralKeySecret: ephemeralKey,
    //         paymentIntentClientSecret: paymentIntent,
    //         defaultBillingDetails: {
    //             name: 'Rani',
    //             email: 'jenny.rosen@example.com',
    //             phone: '888-888-8888',
    //         }
    //     });
    //     if (!error) {
    //         setLoading(true);
    //     }
    // };

    // const openPaymentSheet = async () => {
    //     // see below
    //     const { error } = await presentPaymentSheet();
    //     console.log(error);

    //     if (error) {
    //         alert(`Error code: ${error.code}`, error.message);
    //     } else {
    //         alert('Success', 'Your order is confirmed!');
    //         //confirm from restro and rider login begins from here
    //     }
    // };

    // useEffect(() => {
    //     initializePaymentSheet();
    // }, []);

    // const fetchPaymentIntentClientSecret = async () => {
    //     // Fetch payment intent created on the server, see above
    //     const response = await fetch("https://trioserver.onrender.com/api/v1/payments/gpay", {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             currency: 'INR',
    //             "amount": newTotalAmount + tipAmount
    //         }),
    //     });
    //     const { clientSecret } = await response.json();

    //     return clientSecret;
    // };

    // const pay = async () => {
    //     const clientSecret = await fetchPaymentIntentClientSecret();

    //     const { error } = await confirmPlatformPayPayment(
    //         clientSecret,
    //         {
    //             googlePay: {
    //                 testEnv: true,
    //                 merchantName: 'Trio',
    //                 merchantCountryCode: 'IN',
    //                 currencyCode: 'INR',
    //                 billingAddressConfig: {
    //                     format: PlatformPay.BillingAddressFormat.Full,
    //                     isPhoneNumberRequilightgreen: true,
    //                     isRequilightgreen: true,
    //                 },
    //             },
    //         }
    //     );

    //     if (error) {
    //         alert(error.code, error.message);
    //         // Update UI to prompt user to retry payment (and possibly another payment method)
    //         return;
    //     }
    //     alert('Success', 'The payment was confirmed successfully.');
    // };

    useEffect(async() => {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata');
        const data = await response.json();
        const currentHour = new Date(data.datetime).getHours();
        const isDiscountTime = currentHour >= 0 && currentHour <= 6; // Checking if the time is between 12 AM and 6 AM
        let fee = distance * 10.5;

        if (isDiscountTime) {
            fee *= 2; // Double the delivery fee if the time is between 12 AM and 6 AM
        }

        setDeliveryFee(fee); // Update the state with the calculated delivery fee
    }, [distance]);

    const codOrderConfirm = async () => {
        setLoading(true);
        console.log("Tapped", socket);
        console.log("Restro", deviceToken);
        const userDeviceToken = await AsyncStorage.getItem("deviceToken")
        const StringUserdata = await AsyncStorage.getItem("Userdata")
        const Userdata = JSON.parse(StringUserdata);
        console.log("Userdata", Userdata);
        console.log("UserdataAddress", Userdata.address, Userdata._id);
        console.log("SocketId", socket.id);
        const otp = Math.floor(1000 + Math.random() * 9000);
        console.log(`Generated OTP: ${otp}`);
        socket.emit("FoodyOrderPlaced", { restroId, deviceToken, newSelectedFoods, newTotalItem, newTotalAmount: newTotalAmount + deliveryFee + tipAmount + platformFee, riderEarning: deliveryFee + tipAmount, newTotalRestroAmount, userDeviceToken, socketId: socket.id, userAddress: Userdata.address || '', userId: Userdata._id, otp })
    }

    socket.on("OrderRejectedbyRestaurant", async (data) => {
        //when data.userId equals this users id then only execute next lines
        setLoading(false)
        const StringUserdata = await AsyncStorage.getItem("Userdata")
        const Userdata = JSON.parse(StringUserdata);
        if (data.userId === Userdata._id) {
            console.log(data);
            setRestroRejected(true);
        }
    })

    if (restroRejected) {
        return (
            <View style={styles.restroContainer}>
                <Text style={styles.messageText}>
                    Sorry! The Restaurant is a little busy, it can't take your orders right now!
                </Text>
                <Text style={styles.subMessageText}>
                    Order from a different Restaurant
                </Text>
                <LottieView
                    source={require('../../assets/Animations/RestroRejected.json')}
                    style={styles.lottie}
                    autoPlay
                    loop
                />
                <TouchableOpacity style={styles.resbutton} onPress={() => { props.navigation.pop(2) }}>
                    <Text style={styles.resbuttonText}>Go Back!</Text>
                </TouchableOpacity>
            </View>
        );
    }

    socket.on("OrderAcceptedbyRestaurant", async (data) => {
        //when data.userId equals this users id then only execute next lines
        setLoading(false);
        const StringUserdata = await AsyncStorage.getItem("Userdata")
        const Userdata = JSON.parse(StringUserdata);
        if (data.data.userId === Userdata._id) {
            setRestroAccepted(true)
            console.log(data);
            await new Promise(resolve => setTimeout(resolve, 3000));
            props.navigation.push("MapDirection", { orderId: data.orderId, socket, userId: Userdata._id })
        }
    })

    if (restroAccepted) {
        return (
            <View style={styles.container3}>
                <Text style={styles.mainMessage}>
                    Order Accepted
                </Text>
                <Text style={styles.subMessage}>
                    Searching For Your Delivery Partner
                </Text>
                <LottieView
                    source={require('../../assets/Animations/RiderSearch.json')}
                    style={styles.lottie2}
                    autoPlay
                    loop
                />
            </View>
        );
    }

    if (loading) {
        return <Loading />
    }

    return (
        <ScrollView>
            <View style={styles.container1}>
                <View>
                    <BackButton params={{ text: restroName }} />
                </View>
                <View style={styles.innerContainer1}>
                    {newSelectedFoods.map((item, index) => (
                        <View key={index} style={styles.items}>
                            <Text style={{ color: 'black', fontWeight: '700', fontSize: 16, width: 100 }}>{item.name}</Text>
                            <View style={styles.itemIncDec}>
                                <TouchableOpacity onPress={() => { decrementCounter(index) }}>
                                    <Icon name="minus" size={18} color="black" />
                                </TouchableOpacity>
                                <Text style={{ color: 'black', fontSize: 16, fontWeight: '700' }}>{foods[index]}</Text>
                                <TouchableOpacity onPress={() => { incrementCounter(index) }}>
                                    <Icon name="plus" size={18} color="black" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: 'black', fontWeight: '700', fontSize: 16 }}>Rs {item.price}</Text>
                        </View>
                    ))}
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'grey', marginTop: 20 }} />
                    <View style={styles.items}>
                        <Text>Add more Items</Text>
                        <TouchableOpacity onPress={() => props.navigation.pop()}>
                            <Icon name="circle-plus" size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{ padding: 20 }}>
                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700' }}>Delivery Instructions</Text>
                <View style={styles.instruc}>
                    <TouchableOpacity
                        onPress={() => {
                            const update = [...deliveryInstructions];
                            update[0] = !deliveryInstructions[0];
                            setDeliveryInstructions(update)
                        }}
                        style={[styles.box, deliveryInstructions[0] ? { backgroundColor: 'lightgreen' } : null]}>
                        <Icon name="bell-slash" size={30} style={{ textAlign: 'center' }} color="black" />
                        <Text style={{ fontSize: 10, width: width / 8, height: 40, textAlign: 'center', color: 'black' }}>Avoid Ringing Bell</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            const update = [...deliveryInstructions];
                            update[1] = !deliveryInstructions[1];
                            setDeliveryInstructions(update)
                        }}
                        style={[styles.box, deliveryInstructions[1] ? { backgroundColor: 'lightgreen' } : null]}>
                        <Icon name="phone-slash" size={30} style={{ textAlign: 'center' }} color="black" />
                        <Text style={{ fontSize: 10, width: width / 8, height: 40, textAlign: 'center', color: 'black' }}>Avoid Calling</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            const update = [...deliveryInstructions];
                            update[2] = !deliveryInstructions[2];
                            setDeliveryInstructions(update)
                        }}
                        style={[styles.box, deliveryInstructions[2] ? { backgroundColor: 'lightgreen' } : null]}>
                        <Icon name="person-military-pointing" size={30} style={{ textAlign: 'center' }} color="black" />
                        <Text style={{ fontSize: 10, width: width / 8, height: 40, textAlign: 'center', color: 'black' }}>Leave to Security Guard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            const update = [...deliveryInstructions];
                            update[3] = !deliveryInstructions[3];
                            setDeliveryInstructions(update)
                        }}
                        style={[styles.box, deliveryInstructions[3] ? { backgroundColor: 'lightgreen' } : null]}>
                        <Icon name="hand-holding-dollar" size={30} style={{ textAlign: 'center' }} color="black" />
                        <Text style={{ fontSize: 10, width: width / 8, height: 40, textAlign: 'center', color: 'black' }}>Donate to any Poor People</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700' }}>Tip Your Delivery Partner</Text>
                <View style={{ backgroundColor: 'lightblue', width: '100%', padding: 20, borderRadius: 20, marginTop: 10 }}>
                    <Text style={{ color: 'black', fontSize: 12, textAlign: 'center' }}>Thank Your Delivery Partner by leaving them a tip</Text>
                    <View style={styles.instruc}>
                        <TouchableOpacity
                            onPress={() => {
                                const update = [...tipSelect];
                                update[0] = !tipSelect[0];
                                setTipSelect(update)
                                if (!tipSelect[0]) {
                                    setTipAmount(tipAmount + 10);
                                }
                                else {
                                    setTipAmount(tipAmount - 10);
                                }
                            }}
                            style={[styles.box2, tipSelect[0] ? { backgroundColor: 'lightgreen' } : null]}>
                            <Text style={{ fontSize: 10, width: 40, height: 15, textAlign: 'center', color: 'black' }}>RS 10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                const update = [...tipSelect];
                                update[1] = !tipSelect[1];
                                setTipSelect(update);
                                if (!tipSelect[1]) {
                                    setTipAmount(tipAmount + 20);
                                }
                                else {
                                    setTipAmount(tipAmount - 20);
                                }
                            }}
                            style={[styles.box2, tipSelect[1] ? { backgroundColor: 'lightgreen' } : null]}>
                            <Text style={{ fontSize: 10, width: 40, height: 15, textAlign: 'center', color: 'black' }}>Rs 20</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                const update = [...tipSelect];
                                update[2] = !tipSelect[2];
                                setTipSelect(update);
                                if (!tipSelect[2]) {
                                    setTipAmount(tipAmount + 50);
                                }
                                else {
                                    setTipAmount(tipAmount - 50);
                                }
                            }}
                            style={[styles.box2, tipSelect[2] ? { backgroundColor: 'lightgreen' } : null]}>
                            <Text style={{ fontSize: 10, width: 40, height: 15, textAlign: 'center', color: 'black' }}>Rs 50</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                const update = [...tipSelect];
                                update[3] = !tipSelect[3];
                                setTipSelect(update);
                                if (!tipSelect[3]) {
                                    setTipAmount(tipAmount + 100);
                                }
                                else {
                                    setTipAmount(tipAmount - 100);
                                }
                            }}
                            style={[styles.box2, tipSelect[3] ? { backgroundColor: 'lightgreen' } : null]}>
                            <Text style={{ fontSize: 10, width: 40, height: 15, textAlign: 'center', color: 'black' }}>Rs 100</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700' }}>Bill Details</Text>
                <View style={{ backgroundColor: 'lightblue', width: '100%', padding: 20, borderRadius: 20, marginTop: 10 }}>
                    <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>
                        <Icon name="motorcycle" size={20} color="black" /> {`\u00A0`} {`\u00A0`}
                        25-30 mins to Home</Text>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Total Amount</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {newTotalAmount}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Delivery fee</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {deliveryFee}</Text>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Delivery Tip</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {tipAmount}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Platform fee</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {platformFee}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>GST & Restaurant Charges</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs 30</Text>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>To Pay</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {newTotalAmount + tipAmount + deliveryFee + platformFee}</Text>
                    </View>
                </View>
            </View>

            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ marginVertical: 3, width: '80%', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#A9A9A9' }}>Cancellation Policy</Text>
                    </TouchableOpacity>
                    {isExpanded && (
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ color: 'grey', fontSize: 14, fontWeight: '700' }}>Boor Boor Boor</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={{ padding: 20 }}>
                <TouchableOpacity
                    style={[styles.pay, googlePay ? { backgroundColor: 'lightgreen' } : null, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
                    onPress={() => {
                        setGooglePay(true);
                        setPhonePay(false);
                        setCard(false);
                        setCod(false);
                    }}>
                    <Icon name="google-pay" size={25} color="black" />
                    <Text style={{ color: 'black', fontSize: 15, fontWeight: '700' }}>Google Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.pay, phonePay ? { backgroundColor: 'lightgreen' } : null]}
                    onPress={() => {
                        setPhonePay(true);
                        setGooglePay(false);
                        setCard(false);
                        setCod(false);
                    }}>
                    <Icon name="apple-pay" size={25} color="black" />
                    <Text style={{ color: 'black', fontSize: 15, fontWeight: '700' }}>Phone Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.pay, card ? { backgroundColor: 'lightgreen' } : null]}
                    onPress={() => {
                        setCard(true);
                        setPhonePay(false);
                        setGooglePay(false);
                        setCod(false);
                    }}>
                    <Icon name="credit-card" size={25} color="black" />
                    <Text style={{ color: 'black', fontSize: 15, fontWeight: '700' }}>Credit/Debit Card</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.pay, cod ? { backgroundColor: 'lightgreen' } : null, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]}
                    onPress={() => {
                        setCod(true);
                        setCard(false);
                        setPhonePay(false);
                        setGooglePay(false);
                    }}>
                    <Icon name="money-bill" size={20} color="black" />
                    <Text style={{ color: 'black', fontSize: 15, fontWeight: '700' }}>Cash On Delivery</Text>
                </TouchableOpacity>
            </View>

            <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: 'lightblue' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>Pay Rs {newTotalAmount + tipAmount + deliveryFee + platformFee}</Text>
                    {cod && (
                        <TouchableOpacity
                            onPress={codOrderConfirm}
                            style={{ backgroundColor: 'lightgreen', padding: 15, borderRadius: 10 }}>
                            <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Pay Cash On Delivery</Text>
                        </TouchableOpacity>
                    )}
                    {googlePay && (
                        <StripeProvider
                            publishableKey="pk_test_51P562USCfSZTgwMiYnsnvNz5LHekpPDtwO8iuvnCtHcmp4XNiip8MU0CPiusAbHBGdp19pzVk3OMHOjNh1f4ejGc00tF6KyKOR"
                        >
                            <PlatformPayButton
                                type={PlatformPay.ButtonType.Pay}
                                onPress={pay}
                                style={{
                                    width: '50%',
                                    height: 50,
                                }}
                            />
                        </StripeProvider>
                    )}
                    {phonePay && (
                        <TouchableOpacity>
                            <Text>Pay PhonePay</Text>
                        </TouchableOpacity>
                    )}
                    {card && (
                        <StripeProvider
                            publishableKey="pk_test_51P562USCfSZTgwMiYnsnvNz5LHekpPDtwO8iuvnCtHcmp4XNiip8MU0CPiusAbHBGdp19pzVk3OMHOjNh1f4ejGc00tF6KyKOR">
                            <TouchableOpacity
                                onPress={openPaymentSheet}
                                style={{ backgroundColor: 'lightgreen', padding: 15, borderRadius: 10 }}>
                                <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Pay Credit/Debit Card</Text>
                            </TouchableOpacity>
                        </StripeProvider>
                    )}
                </View>
            </View>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container1: {
        backgroundColor: 'lightblue',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    lottie: {
        width: '100%',
        height: '100%',
    },
    innerContainer1: {
        backgroundColor: 'white',
        padding: 20,
        width: '90%',
        marginLeft: '5%',
        borderRadius: 20,
        marginBottom: 50,
        marginTop: 20
    },
    items: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20
    },
    itemIncDec: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: 'lightblue',
        borderRadius: 13,
        width: width / 4.5,
    },
    instruc: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: 20
    },
    box: {
        backgroundColor: 'lightblue',
        borderRadius: 20,
        padding: 15
    },
    box2: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 10
    },
    bill: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5
    },
    pay: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: 2,
        backgroundColor: 'lightblue',
        padding: 20
    },
    restroContainer: {
        flex: 1,
        backgroundColor: '#f2f2f2', // Light background for a clean look
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    messageText: {
        fontSize: 20,
        color: '#333', // Dark color for contrast
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subMessageText: {
        fontSize: 16,
        color: '#666', // Lighter shade for secondary text
        textAlign: 'center',
        marginBottom: 30,
    },
    lottie: {
        width: width * 0.6, // Lottie animation width to cover a significant part of the screen
        height: height * 0.3, // Adjust height for good aspect ratio
        marginBottom: 30,
    },
    resbutton: {
        backgroundColor: '#1e90ff', // Vibrant blue for the button
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5, // Shadow for Android
    },
    resbuttonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
    container3: {
        flex: 1,
        backgroundColor: '#f7f7f7', // Light, neutral background color
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mainMessage: {
        fontSize: 22,
        color: '#2c3e50', // Dark color for contrast
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    subMessage: {
        fontSize: 18,
        color: '#7f8c8d', // Slightly lighter color for the secondary message
        textAlign: 'center',
        marginBottom: 30,
    },
    lottie2: {
        width: width * 0.7, // Large enough to be noticeable but not overwhelming
        height: height * 0.4, // Adjust height to maintain aspect ratio
    },
})

export default FoodCart
