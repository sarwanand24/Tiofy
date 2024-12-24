import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert, StatusBar } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import CalendarPicker from 'react-native-calendar-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import HotelLoader from './HotelLoader';
import HotelRatingSummary from './HotelRatingSummary';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get("window");

function HotelCart(props) {

    const { hotel, coupleStay, familyStay } = props.route.params;

    const [selectedLaundryShop, setSelectedLaundryShop] = useState(null);
    const [paymentFailure, setPaymentFailure] = useState(false);
    const [verifyFailure, setVerifyFailure] = useState(false);
    const [paymentData, setPaymentData] = useState({});
    const [razorpay, setRazorpay] = useState(false);
    const [cod, setCod] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLaundryShops();
    }, []);

    const fetchLaundryShops = async () => {
        console.log(hotel.city);
        await fetch(`https://trioserver.onrender.com/api/v1/laundry/laundry-by-city-hotel?city=${hotel.city}`)
            .then(res => res.json())
            .then(async (data) => {
                try {
                    console.log(data.data);
                    if (data) {
                        console.log(data);
                        // console.log(data);
                        setSelectedLaundryShop(data.data || null);
                    }
                } catch (error) {
                    console.log("Error in fetching Hotel", error);
                    alert(data)//Show the proper error with the help of message and received and use some code eg. 101 to identify the error
                }
            });
        // const data = await response.json();
    };

    const openGoogleMaps = (latitude, longitude) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        Linking.openURL(url).catch(err =>
            console.error("Failed to open Google Maps", err)
        );
    };

    const [person, setPerson] = useState(1);
    const [markedDates, setMarkedDates] = useState({});
    const [bookedDates, setBookedDates] = useState({})
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [stayLength, setStayLength] = useState(1);
    const [selectedSlot, setSelectedSlot] = useState(0);
    const [availableTimeSlots, setAvailableTimeSlots] = useState({});
    const [laundryServiceAdded, setLaundryServiceAdded] = useState(false);
    const [roomPrice, setRoomPrice] = useState(0);
    const [platformFee, setPlatformFee] = useState(15);
    const [gst, setGst] = useState(12);
    const [selectedSlotTiming, setSelectedSlotTiming] = useState({});
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

    const handleDayPress = (date) => {
        console.log('dates--', date)
        const dateString = date;
      // Use dateString directly
    
       if(dateString) {
        if (!coupleStay) {
            if (!startDate) {
                setStartDate(dateString); // Set start date
            } else if (!endDate) {
                setEndDate(dateString); // Set end date
            } else {
                // Calculate differences in days
                const diffToStart = Math.abs(new Date(startDate) - new Date(dateString));
                const diffToEnd = Math.abs(new Date(endDate) - new Date(dateString));
    
                if (diffToStart < diffToEnd) {
                    setStartDate(dateString); // Update start date
                } else {
                    setEndDate(dateString); // Update end date
                }
            }
        } else {
            if (selectedSlot) {
                // Directly use dateString for single date selection
                const updatedMarkedDates = {
                    [dateString]: { selected: true, marked: true, selectedColor: 'crimson' },
                };
    
                const updatedBookingDates = { [dateString]: true };
                setBookedDates(updatedBookingDates);
                setStayLength(Object.keys(updatedBookingDates).length);
                setMarkedDates(updatedMarkedDates);
            } else {
                Alert.alert("Please select a time slot first");
            }
        }
       }
    };
    
    const markDatesInRange = () => {
        if (!startDate || !endDate) return;
    
        const marked = {};
        const bookingDates = {};
    
        // Use `dateString` directly for accurate date marking
        let currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);
    
        while (currentDate <= endDateObj) {
            const formattedDate = currentDate.toISOString().split('T')[0]; // Local date as ISO string
            marked[formattedDate] = {
                selected: true,
                marked: true,
                selectedColor: 'crimson',
            };
            bookingDates[formattedDate] = true;
    
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        setMarkedDates(marked);
        setBookedDates(bookingDates);
        setStayLength(Object.keys(bookingDates).length);
    
        console.log("Length of Days", Object.keys(bookingDates).length);
        console.log("Marked Dates", marked);
    };

    const customDatesStyles = Object.keys(markedDates).map((dateString) => ({
        date: new Date(dateString), // Convert to Date object
        style: { backgroundColor: 'crimson' },
        textStyle: { color: 'white' },
    }));
        
    // Use `useEffect` with dependency checks for `startDate` and `endDate` changes
    useEffect(() => {
        markDatesInRange();
    }, [startDate, endDate]);
    
    useEffect(() => {
        const pricing = async () => {
            const response2 = await fetch('https://trioserver.onrender.com/api/v1/users/get-all-fees');
            const data2 = await response2.json();
            
            const newPlatformFee = data2?.convinientFee || platformFee;
            const newGst = data2?.hotelGst || gst;
            const newPrice = calculatePrice(person, hotel, stayLength, selectedSlot);
    
            // Update only if values have changed
            if (newPlatformFee !== platformFee) setPlatformFee(newPlatformFee);
            if (newGst !== gst) setGst(newGst);
            if (newPrice !== roomPrice) setRoomPrice(newPrice);
        };
        pricing();
    }, [person, hotel, stayLength, selectedSlot]);
    
    const calculatePrice = (person, hotel, stayLength, selectedSlot) => {
        let finalPrice = hotel.price;
        if (coupleStay && selectedSlot) {
            if (selectedSlot === 3) finalPrice = hotel.price3hr;
            else if (selectedSlot === 6) finalPrice = hotel.price6hr;
            else if (selectedSlot === 12) finalPrice = hotel.price12hr;
        }
        return Math.ceil(person / 2) * finalPrice * stayLength;
    };
    

    // Inside your slot selection handler
   
    const handleSlotSelection = async (hours) => {
        setSelectedSlot(hours); // Store the selected slot (e.g., 3, 6, 9, or 12 hours)
        setMarkedDates({}); // Clear any previously selected dates
    };

  // Function to generate time slots based on the selected slot duration
  const generateTimeSlots = () => {
    const startHour = 7; // Start from 7 AM
    const endHour = 31; // End at 7 AM the next day (24 + 7 = 31 for the next day's 7 AM)
    const slots = [];

    if (selectedSlot) {
        let hour = startHour;
        while (hour < endHour) {
            const start = formatTime(hour);
            const end = formatTime(hour + selectedSlot); // Calculate end time

            // Ensure the end doesn't exceed 7 AM the next day
            if (hour + selectedSlot <= endHour) {
                slots.push({ start, end }); // Add to the slots list
                hour += selectedSlot; // Move to the next time slot
            } else {
                break; // Stop if the slot exceeds the end hour
            }
        }
    }

    return slots; // Return generated slots instead of directly updating state
};

// Helper function to format time in 12-hour AM/PM format
const formatTime = (hour) => {
    console.log('rani2', hour)
    const adjustedHour = hour % 24; // Wrap around after 23 to start from 0
    console.log('adjustedHOur', adjustedHour)
    const amPm = adjustedHour >= 12 ? 'PM' : 'AM';
    console.log('ampm:', amPm)
    const formattedHour = adjustedHour % 12 || 12; // Convert to 12-hour format
    console.log('formattedHour:', formattedHour)
    return `${formattedHour} ${amPm}`;
};
    
    //   Update available slots whenever the selected slot changes
    useEffect(() => {
        const newSlots = generateTimeSlots();
        if (JSON.stringify(newSlots) !== JSON.stringify(availableTimeSlots)) {
            setAvailableTimeSlots(newSlots); // Update only if different
        }
    }, [selectedSlot]);    

    //------------------------------- Payment Integration --------------------------------

    const verifyPayment = async (paymentData) => {
        setLoading(true)
        try {
            const response = await fetch('https://trioserver.onrender.com/api/v1/payments/verifyPayment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData), // Send the payment data (order_id, payment_id, signature)
            });

            const verificationResponse = await response.json();
            console.log('responsee verification', verificationResponse);

            if (verificationResponse.success) {
              //Order Booking starts here ...........
              const StringUserdata = await AsyncStorage.getItem("Userdata")
              const Userdata = JSON.parse(StringUserdata);
              console.log("Userdata", Userdata);
              setLoading(true);
              try {
                  if(hotel.roomsAvailable >= (Math.ceil(person / 2))){
                      if (selectedLaundryShop) {
                          // API call to create a laundry order
                          await fetch(`https://trioserver.onrender.com/api/v1/laundryOrder/placeOrder/${65 + "fdc50e778b1f945a8f4573"}/${selectedLaundryShop._id}/${Userdata._id}`, {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                  fromLocation: selectedLaundryShop?.address || 'home', // Assuming static value or modify as needed
                                  toLocation: hotel.address // Hotel address
                              })
                          });
                          // Add logic to handle successful order creation if needed
                      }
                    // Determine the appropriate price based on coupleStay and selectedSlot
          
          const response = await fetch(`https://trioserver.onrender.com/api/v1/hotelOrder/placeOrder/${Userdata._id}/${hotel._id}`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  "bill": roomPrice + platformFee + Math.ceil((gst/100)*(roomPrice + platformFee)),
                  "savings": platformFee + Math.ceil((gst/100)*(roomPrice + platformFee)),
                  "totalPerson": person,
                  "rooms": Math.ceil(person / 2),
                  "dates": bookedDates,
                  "orderType": coupleStay ? 'couples' : 'general',
                  ...(coupleStay && { "slotTiming": selectedSlotTiming }) // Include slotTimings if coupleStay is true
              })
          })
          .then(res => res.json())
          .then(async (data) => {
              console.log(data);
              if (data.data) {
                  setLoading(false);
                  props.navigation.pop(3);
                  props.navigation.replace('HotelDashboard');
              } else {
                  Alert.alert("Booking Failed!!!");
              }
          });
                  }
                  else{
                      console.log(`Sorry we have only ${hotel.roomsAvailable} rooms available, and are short of ${(Math.ceil(person / 2))-hotel.roomsAvailable} rooms`);
                  }
              }
              catch (error) {
                  console.log("Error in booking Order", error)
              }finally{setLoading(false)}

            } else {
                setVerifyFailure(true)
                await new Promise((resolve) => setTimeout(resolve, 3000));
                setVerifyFailure(false)
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            setVerifyFailure(true)
            await new Promise((resolve) => setTimeout(resolve, 3000));
            setVerifyFailure(false)
        }
    };

    useEffect(() => {
        if (paymentData && Object.keys(paymentData).length > 0) {
            verifyPayment(paymentData);
        }
    }, [paymentData])

    const razorPay = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://trioserver.onrender.com/api/v1/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: roomPrice + platformFee + (gst/100)*(roomPrice + platformFee), // Example amount in INR (Rupees)
                }),
            });
            setLoading(false);
            const orderData = await response.json();

            console.log('OrderData', orderData);

            var options = {
                description: 'Hotel Order Payments',
                image: logo,
                currency: 'INR',
                key: 'rzp_test_TLbKsNVqgyyLdp',
                amount: orderData.amount,
                name: 'Tiofy Hotel',
                order_id: orderData.id,//Replace this with an order_id created using Orders API.
                prefill: {
                    email: 'nikhildhamgay200424@gmail.com',
                    contact: '7550894302',
                    name: 'Nikhil Dhamgay'
                },
                theme: { color: '#5ecdf9' }
            }
            RazorpayCheckout.open(options).then((data) => {
                const paymentData = {
                    razorpay_order_id: data.razorpay_order_id,
                    razorpay_payment_id: data.razorpay_payment_id,
                    razorpay_signature: data.razorpay_signature,
                };
                console.log('payment Data', paymentData);
                //   verifyPayment(paymentData);
                setPaymentData(paymentData);
            }).catch((error) => {
                // handle failure
                console.error(error);
            });
        } catch (error) {
            console.error(error);
            setPaymentFailure(true)
        }
    }

    if (paymentFailure) {
        return (
            <View style={styles.restroContainer}>
                <Text style={styles.messageText}>
                    OOps! Payment Unsuccessfull
                </Text>
                <Text style={styles.subMessageText}>
                    Please try again!
                </Text>
                <LottieView
                    source={require('../../assets/Animations/RestroRejected.json')}
                    style={styles.lottie}
                    autoPlay
                    loop
                />
                <TouchableOpacity style={styles.resbutton} onPress={() => { props.navigation.pop() }}>
                    <Text style={styles.resbuttonText}>Go Back!</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (verifyFailure) {
        return (
            <View style={styles.restroContainer}>
                <Text style={styles.messageText}>
                    OOps! Payment Verification Failed
                </Text>
                <Text style={styles.subMessageText}>
                    Something went wrong, You might have cheated us!
                </Text>
                <LottieView
                    source={require('../../assets/Animations/RestroRejected.json')}
                    style={styles.lottie}
                    autoPlay
                    loop
                />
                <TouchableOpacity style={styles.resbutton} onPress={() => { props.navigation.pop() }}>
                    <Text style={styles.resbuttonText}>Go Back!</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const codConfirm = async () => {
        const StringUserdata = await AsyncStorage.getItem("Userdata")
        const Userdata = JSON.parse(StringUserdata);
        console.log("Userdata", Userdata._id, hotel._id);
        setLoading(true);
        try {
            console.log('checkin done', hotel)
            if(hotel.roomsAvailable >= (Math.ceil(person / 2))){
                if (selectedLaundryShop) {
                    // API call to create a laundry order
                    console.log('checkin done for laundry', selectedLaundryShop?.address)
                    await fetch(`https://trioserver.onrender.com/api/v1/laundryOrder/placeOrder/${65 + "fdc50e778b1f945a8f4573"}/${selectedLaundryShop._id}/${Userdata._id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fromLocation: selectedLaundryShop?.address || 'home', // Assuming static value or modify as needed
                            toLocation: hotel.address // Hotel address
                        })
                    });
                    // Add logic to handle successful order creation if needed
                    console.log('checkout done for laundry')
                }
              // Determine the appropriate price based on coupleStay and selectedSlot
    const response = await fetch(`https://trioserver.onrender.com/api/v1/hotelOrder/placeOrder/${Userdata._id}/${hotel._id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "bill": roomPrice + platformFee + Math.ceil((gst/100)*(roomPrice + platformFee)),
            "savings": platformFee + Math.ceil((gst/100)*(roomPrice + platformFee)),
            "totalPerson": person,
            "rooms": Math.ceil(person / 2),
            "dates": bookedDates,
            "orderType": coupleStay ? 'couples' : 'general',
            ...(coupleStay && { "slotTiming": selectedSlotTiming }) // Include slotTimings if coupleStay is true
        })
    })
    .then(res => res.json())
    .then(async (data) => {
        console.log('check dataaaaa rani', data);
        if (data.data) {
            props.navigation.pop(3);
            props.navigation.replace('HotelDashboard');
        } else {
            Alert.alert("Booking Failed!!!");
        }
    });
            }
            else{
                Alert.alert(`Sorry we have only ${hotel.roomsAvailable} rooms available, and are short of ${(Math.ceil(person / 2))-hotel.roomsAvailable} rooms`);
            }
        }
        catch (error) {
            console.log("Error in booking Order", error)
        }finally{setLoading(false)}
    }

    if(loading){
       return (
        <View style={styles.loading}>
           <LottieView source={require('../../assets/Animations/confirmation.json')}
           style={styles.lottie} autoPlay loop />
        </View>
       )
    }

    return (
        <ScrollView style={{flex:1, backgroundColor:'#68095f'}}>
               <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
            <View>
                <Image source={{ uri: hotel.hotelPhoto }} style={{ widht: width, height: height / 2.3 }} />
            </View>
            <Text style={{ color: '#ffff00', textAlign: 'center', fontSize: 20, fontWeight:'700' }}>
                {hotel.hotelName}
            </Text>

            <View style={[styles.stars, {marginLeft:8}]}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                        key={star}
                        name={star <= Math.floor(hotel.ratings) ? 'star' : 'star'}
                        size={20}
                        color={star <= Math.floor(hotel.ratings) ? '#FFD700' : '#D3D3D3'}
                    />
                ))}
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{'\u00A0'}{'\u00A0'}{Math.floor(hotel.ratings)}</Text>
            </View>

            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500', marginLeft: 8 }}>{hotel.address}</Text>

            <TouchableOpacity onPress={() => { openGoogleMaps(hotel.latitude, hotel.longitude) }}>
                <Text style={{ color: '#ffff00', fontSize: 14, fontWeight: '500', fontStyle: 'italic', marginLeft: 8 }}>View on map</Text>
            </TouchableOpacity>

         {hotel.facilities && (
               <View style={{padding:15}}>
               <Text style={{ color: "white", fontWeight: '800', fontSize: 16, marginVertical: 8 }}>Other Key Offerings</Text>
                {/* Map over facilities array to display each item as a bullet point */}
     {hotel?.facilities?.map((facility, index) => (
       <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
         <Text style={{ fontSize: 16, color: "white" }}>•</Text>
         <Text style={{ fontSize: 16, color: "white", marginLeft: 8 }}>{facility}</Text>
       </View>
     ))}
        </View>
         )}
         

            {coupleStay && (
                <View style={{ padding: 8 }}>
                    <Text style={{ color: "white", fontWeight: '800', fontSize: 16, marginVertical: 8 }}>Book a slot</Text>
                    <View style={styles.slotContainer}>
                        <TouchableOpacity
                            onPress={() => { handleSlotSelection(3) }}>
                            <View style={[styles.slotPress, (selectedSlot == 3) ? { backgroundColor: '#ffff00' } : null]}>
                                <Text style={{ textAlign: 'center', color: selectedSlot === 3 ? 'black' : 'white', fontWeight: '800', fontSize: 16 }}>3hr</Text>
                            </View>
                            <Text style={{ textAlign: 'center', color: 'white', fontSize: 16 }}>Rs{hotel?.price3hr}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { handleSlotSelection(6) }}>
                            <View style={[styles.slotPress, (selectedSlot == 6) ? { backgroundColor: '#ffff00' } : null]}>
                                <Text style={{ textAlign: 'center', color: selectedSlot === 6 ? 'black' : 'white', fontSize: 16, fontWeight: '800' }}>6hr</Text>
                            </View>
                            <Text style={{ textAlign: 'center', color: 'white', fontSize: 16 }}>Rs{hotel?.price6hr}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { handleSlotSelection(12) }}>
                            <View style={[styles.slotPress, (selectedSlot == 12) ? { backgroundColor: '#ffff00' } : null]}>
                                <Text style={{ textAlign: 'center', color: selectedSlot === 12 ? 'black' : 'white', fontSize: 16, fontWeight: '800' }}>12hr</Text>
                            </View>
                            <Text style={{ textAlign: 'center', color: 'white', fontSize: 16 }}>Rs{hotel?.price12hr}</Text>
                        </TouchableOpacity>
                    </View>

                    {availableTimeSlots.length > 0 && (
  <ScrollView horizontal style={{ marginVertical: 10 }}>
    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 5 }}>Available Slots:</Text>
    <View style={{ flexDirection: 'row', marginTop: 20 }}>
      {availableTimeSlots.map((slot, index) => (
        <TouchableOpacity
          key={index}
          style={{
            padding: 10,
            backgroundColor: selectedSlotIndex === index ? '#9f0d91' : '#ffff00',
            marginHorizontal: 5,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: selectedSlotIndex === index ? 'transparent' : 'black',
          }}
          onPress={() => {
            setSelectedSlotIndex(index);
            setSelectedSlotTiming({ start: slot.start, end: slot.end });
          }}
        >
          <Text style={{ textAlign: 'center', color: selectedSlotIndex === index ? 'white' : 'black', fontSize: 14 }}>
            {slot.start} - {slot.end}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
)}

                    <Text style={{ color: "white", fontWeight: '800', fontSize: 16, marginVertical: 8 }}>Why Book This?</Text>
                    <Text style={{ color: "white", fontWeight: '600', fontSize: 14, marginHorizontal: 8 }}>
                        <Icon name='children' size={20} color='#ffff00' style={{ marginRight: 5 }} />
                        Couples are Welcome
                    </Text>
                    <Text style={{ color: "white", fontWeight: '600', fontSize: 14, marginHorizontal: 8 }}>Unmarried Couples are allowed at the property</Text>
                </View>
            )}

            <View style={{ marginTop: 10 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginLeft: 15 }}>Details:</Text>

                <View style={styles.container}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>No. of guests: </Text>
                    <View style={styles.itemIncDec}>
                        <TouchableOpacity onPress={() => {
                            if (person > 1) {
                                setPerson(person - 1)
                            }
                        }}>
                            <Icon name="minus" size={24} color="white" style={styles.IncDecicon} />
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{person}</Text>
                        <TouchableOpacity onPress={() => {
                            setPerson(person + 1);
                        }}>
                            <Icon name="plus" size={24} color="white" style={styles.IncDecicon} />
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Rooms: {Math.ceil(person / 2)}</Text>
                </View>
            </View>

            <CalendarPicker
                onDateChange={handleDayPress}
                minDate={new Date()} // Minimum selectable date
                todayBackgroundColor="transparent"
                selectedDayColor="crimson"
                selectedDayTextColor="#ffffff"
                textStyle={{
                    color: '#ffffff',
                    fontFamily: 'monospace',
                }}
                monthTitleStyle={{
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                }}
                yearTitleStyle={{
                    color: '#ffffff',
                    fontFamily: 'monospace',
                }}
                customDatesStyles={customDatesStyles} // Apply custom marked styles
            />


            {/* Laundry Shop Section */}
            {selectedLaundryShop && (
        <View style={styles.laundryContainer}>
          <Text style={styles.laundryTitle}>Laundry Service</Text>
          <View style={styles.laundryShop}>
            <Image source={{ uri: selectedLaundryShop.shopPhoto }} style={styles.laundryImage} />
            <Text style={styles.laundryName}>{selectedLaundryShop.name}</Text>
          </View>

          <View style={styles.laundryQuestion}>
            <Text style={styles.laundryQuestionText}>Do you want laundry service during your stay?</Text>

            {laundryServiceAdded ? (
              <Text style={[styles.laundryAddedText, {color: 'white'}]}>Laundry added to hotel bookings</Text>
            ) : (
              <View style={styles.laundryButtons}>
                <TouchableOpacity
                  style={styles.laundryButton}
                  onPress={() => {
                    setLaundryServiceAdded(true);
                  }}
                >
                  <Text style={styles.laundryButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.laundryButton}
                  onPress={() => {
                    setSelectedLaundryShop(null);
                  }}
                >
                  <Text style={styles.laundryButtonText}>No</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      <HotelRatingSummary hotelId={hotel._id} />

  <View style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20, paddingTop: 10 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Bill Details</Text>
                <View style={{ backgroundColor: '#9f0d91', width: '100%', padding: 20, borderRadius: 20, marginTop: 10 }}>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'white', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Total Room</Text>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{Math.ceil(person / 2)}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Total Person</Text>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{person}</Text>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'white', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Bill</Text>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Rs {roomPrice}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Convinient fee</Text>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Rs {platformFee}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{gst}% GST & Hotel Charges</Text>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Rs {Math.ceil((gst/100)*(roomPrice + platformFee))}</Text>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'white', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>To Pay</Text>
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Rs {roomPrice + platformFee + Math.ceil((gst/100)*(roomPrice + platformFee))}</Text>
                    </View>
                </View>
            </View>

            {/** Payment Methods **/}

            <View style={{ padding: 20 }}>
                <TouchableOpacity
                    style={[styles.pay, razorpay ? { backgroundColor: '#68095f' } : null, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
                    onPress={() => {
                        setRazorpay(true)
                        setCod(false);
                    }}>
                    <Icon name="credit-card" size={25} color="white" />
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>UPI/Credit/Debit/Net Banking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.pay, cod ? { backgroundColor: '#68095f' } : null, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]}
                    onPress={() => {
                        setCod(true);
                        setRazorpay(false)
                    }}>
                    <Icon name="money-bill" size={20} color="white" />
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Cash On Delivery</Text>
                </TouchableOpacity>
            </View>

            <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#9f0d91' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Pay Rs {roomPrice + platformFee + Math.ceil((gst/100)*(roomPrice + platformFee))}</Text>
                    {razorpay && (
                        <TouchableOpacity
                            onPress={razorPay}
                            style={{ backgroundColor: '#68095f', padding: 15, borderRadius: 10 }}>
                            <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Pay UPI/Credit/Debit/Net Banking</Text>
                        </TouchableOpacity>
                    )}
                    {cod && (
                        <TouchableOpacity
                            onPress={codConfirm}
                            style={{ backgroundColor: '#68095f', padding: 15, borderRadius: 10 }}>
                            <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Pay Cash at Hotel</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    stars: {
        flexDirection: 'row'
    },
    itemIncDec: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: '#9f0d91',
        borderRadius: 13,
        width: width / 2.5
    },
    container: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    pay: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: 2,
        backgroundColor: '#9f0d91',
        padding: 20
    },
    laundryContainer: {
        marginVertical: 24,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#9f0d91',
    },
    bill: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5
    },
    laundryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffff00',
        marginBottom: 12,
    },
    laundryShop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    laundryImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#dcdcdc',
    },
    laundryName: {
        fontSize: 18,
        color: '#333',
    },
    laundryQuestion: {
        marginTop: 16,
    },
    laundryQuestionText: {
        fontSize: 18,
        color: 'white',
        fontWeight: '500',
        marginBottom: 10,
    },
    laundryButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    laundryButton: {
        backgroundColor: '#e63946',
        padding: 12,
        borderRadius: 8,
        width: 120,
        alignItems: 'center',
    },
    laundryButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '500',
    },
    slotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly'
    },
    slotPress: {
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 15,
        padding: 8
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
        backgroundColor: '#1e90ff', // Vibrant #ffff00 for the button
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
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#68095f'
    },
    lottie: {
        width: '100%',
        height: '100%',
      }
})

export default HotelCart
