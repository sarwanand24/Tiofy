import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import HotelLoader from './HotelLoader';
import HotelRatingSummary from './HotelRatingSummary';

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
    const [platformFee, setPlatformFee] = useState(5);
    const [selectedSlotTiming, setSelectedSlotTiming] = useState({});
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

    const handleDayPress = (day) => {
        if (!coupleStay) {
            const { dateString } = day;
            const currentDate = new Date(dateString);

            if (!startDate) {
                // If start date is not set, set it
                setStartDate(dateString);
            } else if (!endDate) {
                // If end date is not set, set it
                setEndDate(dateString);
            } else {
                const diffToStart = Math.abs(new Date(startDate) - currentDate);
                const diffToEnd = Math.abs(new Date(endDate) - currentDate);

                if (diffToStart < diffToEnd) {
                    // If the pressed date is closer to the start date, set it as the start date
                    setStartDate(dateString);
                } else {
                    // If the pressed date is closer to the end date, set it as the end date
                    setEndDate(dateString);
                }
            }
        }
        else {
            if (selectedSlot) {
                const formattedDate = new Date(day.dateString).toISOString().split('T')[0]; // Format selected date

                // Update marked dates for single-day selection
                const updatedMarkedDates = {
                  [formattedDate]: { selected: true, marked: true, selectedColor: 'crimson' }
                };
            
                // Update bookedDates and stayLength
                const updatedBookingDates = { [formattedDate]: true };
                setBookedDates(updatedBookingDates);
                setStayLength(Object.keys(updatedBookingDates).length);
                setMarkedDates(updatedMarkedDates);
            } else {
                alert("Please select a time slot first");
            }
        }
    };

    const markDatesInRange = () => {
        if (!startDate || !endDate) return;
    
        const marked = {};
        const bookingDates = {};
        let currentDate = new Date(startDate).setHours(0, 0, 0, 0);
        const endDateObj = new Date(endDate).setHours(0, 0, 0, 0);
    
        while (currentDate <= endDateObj) {
            const formattedDate = new Date(currentDate).toISOString().split('T')[0];
            marked[formattedDate] = {
                selected: true,
                marked: true,
                selectedColor: 'crimson',
            };
            bookingDates[formattedDate] = true;
            currentDate += 24 * 60 * 60 * 1000; // Move to next day
        }
    
        setMarkedDates(marked);
        setBookedDates(bookingDates);
        setStayLength(Object.keys(bookingDates).length);
        console.log("Length of Days", Object.keys(bookingDates).length);
        console.log("Marked Dates", marked);
    };
    
    // Use `useEffect` with dependency checks for `startDate` and `endDate` changes
    useEffect(() => {
        markDatesInRange();
    }, [startDate, endDate]);
    

    useEffect(()=>{
        let finalPrice = hotel.price; // Default price for general bookings

        if (coupleStay && selectedSlot) {
            if (selectedSlot === 3) {
                finalPrice = hotel.price3hr;
            } else if (selectedSlot === 6) {
                finalPrice = hotel.price6hr;
            } else if (selectedSlot === 12) {
                finalPrice = hotel.price12hr;
            }
        }
        
        // Calculate the bill based on the selected price
        const billAmount = Math.ceil(person / 2) * finalPrice * stayLength;
        setRoomPrice(billAmount)
    }, [person])

    // Inside your slot selection handler
   
    const handleSlotSelection = async (hours) => {
        setSelectedSlot(hours); // Store the selected slot (e.g., 3, 6, 9, or 12 hours)
        setMarkedDates({}); // Clear any previously selected dates
    };

  // Function to generate time slots based on the selected slot duration
  const generateTimeSlots = () => {
    const startHour = 7; // Start from 7 AM
    const endHour = 31; // End at 7 AM the next day (24 + 7 = 31 to represent the next day's 7 AM)
    const slots = [];

    if (selectedSlot) {
        let hour = startHour; // Start from the specified start hour
        while (hour < endHour) {
            const start = formatTime(hour);
            const end = formatTime(hour + selectedSlot); // Add selected slot duration to get the end time

            // Ensure end doesn't go past 7 AM next day
            console.log('rani', start, end)
            if (hour + selectedSlot <= endHour) {
                slots.push({ start, end });
                hour += selectedSlot; // Move to the next starting time
            } else {
                break; // Stop the loop if the time exceeds the 7 AM of the next day
            }
        }
    }

    setAvailableTimeSlots(slots); // Set the available time slots
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
        generateTimeSlots();
        console.log('availableSlots:', availableTimeSlots)
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
                                  fromLocation: 'home', // Assuming static value or modify as needed
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
                  "bill": roomPrice,
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
                  alert("Booking Confirmed!!!");
                  props.navigation.replace('HotelDashboard');
              } else {
                  alert("Booking Failed!!!");
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
                    amount: roomPrice + platformFee, // Example amount in INR (Rupees)
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
            console.log('checkin done')
            if(hotel.roomsAvailable >= (Math.ceil(person / 2))){
                if (selectedLaundryShop) {
                    // API call to create a laundry order
                    console.log('checkin done for laundry')
                    await fetch(`https://trioserver.onrender.com/api/v1/laundryOrder/placeOrder/${65 + "fdc50e778b1f945a8f4573"}/${selectedLaundryShop._id}/${Userdata._id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fromLocation: 'home', // Assuming static value or modify as needed
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
            "bill": roomPrice,
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
            alert("Booking Confirmed!!!");
            props.navigation.replace('HotelDashboard');
        } else {
            alert("Booking Failed!!!");
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
    }

    if(loading){
       return (
        <HotelLoader />
       )
    }

    return (
        <ScrollView>
            <View>
                <Image source={{ uri: hotel.hotelPhoto }} style={{ widht: width, height: height / 2.3 }} />
            </View>
            <Text style={{ color: 'black', textAlign: 'center', fontSize: 20, fontWeight:'700' }}>
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
                <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>{'\u00A0'}{'\u00A0'}{Math.floor(hotel.ratings)}</Text>
            </View>

            <Text style={{ color: 'black', fontSize: 14, fontWeight: '500', marginLeft: 8 }}>{hotel.address}</Text>

            <TouchableOpacity onPress={() => { openGoogleMaps(hotel.latitude, hotel.longitude) }}>
                <Text style={{ color: 'blue', fontSize: 14, fontWeight: '500', fontStyle: 'italic', marginLeft: 8 }}>View on map</Text>
            </TouchableOpacity>

         {hotel.facilities && (
               <View style={{padding:15}}>
               <Text style={{ color: "black", fontWeight: '800', fontSize: 16, marginVertical: 8 }}>Other Key Offerings</Text>
                {/* Map over facilities array to display each item as a bullet point */}
     {hotel?.facilities?.map((facility, index) => (
       <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
         <Text style={{ fontSize: 16, color: "black" }}>•</Text>
         <Text style={{ fontSize: 16, color: "black", marginLeft: 8 }}>{facility}</Text>
       </View>
     ))}
        </View>
         )}
         

            {coupleStay && (
                <View style={{ padding: 8 }}>
                    <Text style={{ color: "black", fontWeight: '800', fontSize: 16, marginVertical: 8 }}>Book a slot</Text>
                    <View style={styles.slotContainer}>
                        <TouchableOpacity
                            onPress={() => { handleSlotSelection(3) }}>
                            <View style={[styles.slotPress, (selectedSlot == 3) ? { backgroundColor: 'blue' } : null]}>
                                <Text style={{ textAlign: 'center', color: selectedSlot === 3 ? 'white' : 'blue', fontWeight: '800', fontSize: 16 }}>3hr</Text>
                            </View>
                            <Text style={{ textAlign: 'center', color: 'black', fontSize: 16 }}>Rs 600</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { handleSlotSelection(6) }}>
                            <View style={[styles.slotPress, (selectedSlot == 6) ? { backgroundColor: 'blue' } : null]}>
                                <Text style={{ textAlign: 'center', color: selectedSlot === 6 ? 'white' : 'blue', fontSize: 16, fontWeight: '800' }}>6hr</Text>
                            </View>
                            <Text style={{ textAlign: 'center', color: 'black', fontSize: 16 }}>Rs 800</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => { handleSlotSelection(12) }}>
                            <View style={[styles.slotPress, (selectedSlot == 12) ? { backgroundColor: 'blue' } : null]}>
                                <Text style={{ textAlign: 'center', color: selectedSlot === 12 ? 'white' : 'blue', fontSize: 16, fontWeight: '800' }}>12hr</Text>
                            </View>
                            <Text style={{ textAlign: 'center', color: 'black', fontSize: 16 }}>Rs 1200</Text>
                        </TouchableOpacity>
                    </View>

                    {availableTimeSlots.length > 0 && (
  <ScrollView horizontal style={{ marginVertical: 10 }}>
    <Text style={{ color: 'black', fontSize: 16, fontWeight: '700', marginBottom: 5 }}>Available Slots:</Text>
    <View style={{ flexDirection: 'row', marginTop: 20 }}>
      {availableTimeSlots.map((slot, index) => (
        <TouchableOpacity
          key={index}
          style={{
            padding: 10,
            backgroundColor: selectedSlotIndex === index ? '#5ecdf9' : '#e0e0e0',
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
          <Text style={{ textAlign: 'center', color: 'black', fontSize: 14 }}>
            {slot.start} - {slot.end}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
)}

                    <Text style={{ color: "black", fontWeight: '800', fontSize: 16, marginVertical: 8 }}>Why Book This?</Text>
                    <Text style={{ color: "black", fontWeight: '600', fontSize: 14, marginHorizontal: 8 }}>
                        <Icon name='children' size={20} color='blue' style={{ marginRight: 5 }} />
                        Couples are Welcome
                    </Text>
                    <Text style={{ color: "grey", fontWeight: '600', fontSize: 14, marginHorizontal: 8 }}>Unmarried Couples are allowed at the property</Text>
                </View>
            )}

            <View style={{ marginTop: 10 }}>
                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700' }}>Details:</Text>

                <View style={styles.container}>
                    <Text style={{ color: 'black', fontSize: 14, fontWeight: '500' }}>No. of guests: </Text>
                    <View style={styles.itemIncDec}>
                        <TouchableOpacity onPress={() => {
                            if (person > 1) {
                                setPerson(person - 1)
                            }
                        }}>
                            <Icon name="minus" size={24} color="black" style={styles.IncDecicon} />
                        </TouchableOpacity>
                        <Text style={{ color: 'black', fontSize: 16, fontWeight: '700' }}>{person}</Text>
                        <TouchableOpacity onPress={() => {
                            setPerson(person + 1);
                        }}>
                            <Icon name="plus" size={24} color="black" style={styles.IncDecicon} />
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: 'black', fontSize: 16, fontWeight: '700' }}>Rooms: {Math.ceil(person / 2)}</Text>
                </View>
            </View>

            <Calendar
                style={{
                    borderWidth: 1,
                    borderColor: 'gray',
                    height: 350,
                }}
                theme={{
                    backgroundColor: '#1a1a1a', // Background color
                    calendarBackground: '#333333', // Calendar background color
                    textSectionTitleColor: '#ffffff', // Text color for section titles (e.g., "January 2024")
                    selectedDayBackgroundColor: '#ff6600', // Background color for selected day
                    selectedDayTextColor: '#ffffff', // Text color for selected day
                    todayTextColor: '#ff6600', // Text color for today's date
                    dayTextColor: '#ffffff', // Text color for days
                    textDisabledColor: '#666666', // Text color for disabled (out of range) days
                    dotColor: '#ff6600', // Color of dots (e.g., for marking events)
                    selectedDotColor: '#ffffff', // Color of dots for selected day
                    arrowColor: '#ff6600', // Color of arrows (e.g., for navigating between months)
                    monthTextColor: '#ffffff', // Text color for month title
                    indicatorColor: '#ff6600', // Color for indicators (e.g., for selected date marker)
                    textDayFontFamily: 'monospace', // Font family for day text
                    textMonthFontFamily: 'monospace', // Font family for month text
                    textDayHeaderFontFamily: 'monospace', // Font family for day header text
                    textDayFontWeight: 'normal', // Font weight for day text
                    textMonthFontWeight: 'bold', // Font weight for month text
                    textDayHeaderFontWeight: 'normal', // Font weight for day header text
                    textDayFontSize: 16, // Font size for day text
                    textMonthFontSize: 16, // Font size for month text
                    textDayHeaderFontSize: 16, // Font size for day header text
                }}
                current={new Date().toISOString().split('T')[0]}
                minDate={new Date().toISOString().split('T')[0]}
                onDayPress={handleDayPress}
                markedDates={markedDates}
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
              <Text style={styles.laundryAddedText}>Laundry added to hotel bookings</Text>
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

<View style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
                <Text style={{ color: 'black', fontSize: 20, fontWeight: '700' }}>Bill Details</Text>
                <View style={{ backgroundColor: '#5ecdf9', width: '100%', padding: 20, borderRadius: 20, marginTop: 10 }}>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Total Room</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>{Math.ceil(person / 2)}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Total Person</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>{person}</Text>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Bill</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {roomPrice}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Platform fee</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {platformFee}</Text>
                    </View>
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>GST & Hotel Charges</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs 30</Text>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: 'black', marginTop: 10 }} />
                    <View style={styles.bill}>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>To Pay</Text>
                        <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Rs {roomPrice + platformFee}</Text>
                    </View>
                </View>
            </View>

            {/** Payment Methods **/}

            <View style={{ padding: 20 }}>
                <TouchableOpacity
                    style={[styles.pay, razorpay ? { backgroundColor: 'lightgreen' } : null, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
                    onPress={() => {
                        setRazorpay(true)
                        setCod(false);
                    }}>
                    <Icon name="credit-card" size={25} color="black" />
                    <Text style={{ color: 'black', fontSize: 15, fontWeight: '700' }}>UPI/Credit/Debit/Net Banking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.pay, cod ? { backgroundColor: 'lightgreen' } : null, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]}
                    onPress={() => {
                        setCod(true);
                        setRazorpay(false)
                    }}>
                    <Icon name="money-bill" size={20} color="black" />
                    <Text style={{ color: 'black', fontSize: 15, fontWeight: '700' }}>Cash On Delivery</Text>
                </TouchableOpacity>
            </View>

            <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#5ecdf9' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>Pay Rs {roomPrice + platformFee}</Text>
                    {razorpay && (
                        <TouchableOpacity
                            onPress={razorPay}
                            style={{ backgroundColor: 'lightgreen', padding: 15, borderRadius: 10 }}>
                            <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Pay UPI/Credit/Debit/Net Banking</Text>
                        </TouchableOpacity>
                    )}
                    {cod && (
                        <TouchableOpacity
                            onPress={codConfirm}
                            style={{ backgroundColor: 'lightgreen', padding: 15, borderRadius: 10 }}>
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
        backgroundColor: 'pink',
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
        backgroundColor: '#5ecdf9',
        padding: 20
    },
    laundryContainer: {
        marginVertical: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
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
        color: '#333',
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
        color: '#333',
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
        borderColor: 'black',
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
})

export default HotelCart
