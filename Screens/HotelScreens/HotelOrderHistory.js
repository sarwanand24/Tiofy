import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { getAccessToken } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HotelOrderHistory = () => {
  const [roomBookings, setRoomBookings] = useState([]);
  const [ratedHotels, setRatedHotels] = useState({});
  const [noOrder, setNoOrder] = useState(false);

  useEffect(() => {
    const fetchRoomBookings = async () => {
      try {
        const token = await getAccessToken();
        const response = await axios.get(
          'https://trioserver.onrender.com/api/v1/users/get-room-booking-history',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const sortedBookings = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log('room bookings---->', sortedBookings);

        // Fetch rated hotels from AsyncStorage
        const ratedHotelsData = await AsyncStorage.getItem('ratedHotels');
        const parsedRatedHotels = ratedHotelsData ? JSON.parse(ratedHotelsData) : {};
        setRatedHotels(parsedRatedHotels);
        setRoomBookings(sortedBookings);
      } catch (error) {
        console.log('Error fetching room bookings:', error);
        setNoOrder(true);
      }
    };

    fetchRoomBookings();
  }, []);

  const handleStarPress = async (star, hotelId) => {
    try {
      const jwtToken = await AsyncStorage.getItem("token");
      const response = await fetch(
        `https://trioserver.onrender.com/api/v1/hotelRating/create-ratings/${hotelId}`,
        {
          method: "POST",
          headers: new Headers({
            Authorization: "Bearer " + jwtToken,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            "rating": star,
          }),
        }
      );
      const data = await response.json();
      console.log("Done Rating Successfully", data);

      // Update rated hotels in AsyncStorage
      const updatedRatedHotels = { ...ratedHotels, [hotelId]: star };
      await AsyncStorage.setItem('ratedHotels', JSON.stringify(updatedRatedHotels));
      setRatedHotels(updatedRatedHotels);
    } catch (error) {
      console.log("Error in setting Ratings for Hotel", error);
      alert("Error in setting Ratings for Hotel: " + error.message);
    }
  };

  const formatDate = (date) => {
    let parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      try {
        parsedDate = new Date(Date.parse(date));
      } catch {
        return 'Invalid Date';
      }
    }
    return parsedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const renderBooking = ({ item }) => {
    const hotelId = item.hotel?._id;
    const isRated = !!ratedHotels[hotelId];
    const currentRating = ratedHotels[hotelId] || 0;

    return (
      <View style={styles.bookingContainer}>
           <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
        <Text style={styles.bookingText}>BookingId: {item._id}</Text>
        <Text style={styles.bookingText}>Hotel: {item.hotel?.hotelName}</Text>
        <Text style={styles.bookingText}>Total Bill: Rs {item.bill}</Text>
        <Text style={styles.bookingText}>Total Persons: {item.totalPerson}</Text>
        <Text style={styles.bookingText}>Rooms: {item.rooms}</Text>
        <Text style={styles.bookingText}>Booking Type: {item.orderType}</Text>
        {item.slotTiming && (
          <Text style={styles.bookingText}>
            Slot Timing: {item.slotTiming.start} - {item.slotTiming.end}
          </Text>
        )}
        <Text style={styles.bookingText}>Dates:</Text>
        {item?.dates &&
          Object.keys(item.dates).map((date, index) => (
            <Text key={index} style={styles.dateText}>
              {formatDate(date)}: {item.dates[date] ? 'Booked' : 'Available'}
            </Text>
          ))}
        <Text style={styles.bookingText}>Booked On: {new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.bookingText}>Rate hotel below:</Text>
        <View style={{ flexDirection: 'row' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star, hotelId)}
              disabled={isRated} // Disable if already rated
            >
              <Icon
                name="star"
                size={30}
                color={currentRating >= star ? 'yellow' : 'white'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {isRated && (
          <Text style={styles.bookingText}>
            You rated this hotel with {currentRating} stars.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Booking History</Text>
      {noOrder && <Text style={styles.title}>No Room Booking History Yet</Text>}
      <FlatList
        data={roomBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#68095f',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ffff00',
  },
  bookingContainer: {
    padding: 16,
    backgroundColor: '#9f0d91',
    borderRadius: 10,
    marginBottom: 16,
    elevation: 5,
    borderColor: '#ffff00',
    borderWidth: 1,
  },
  bookingText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#ffff00',
    marginLeft: 10,
  },
});

export default HotelOrderHistory;
