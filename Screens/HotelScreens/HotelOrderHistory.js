import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { getAccessToken } from '../../utils/auth';

const HotelOrderHistory = () => {
  const [roomBookings, setRoomBookings] = useState([]);
  const [rating, setRating] = useState(0);
  const [isRated, setIsRated] = useState(false);
  const [noOrder, setnoOrder] = useState(false);

  useEffect(() => {
    const fetchRoomBookings = async () => {
      try {
        const token = await getAccessToken();
        const response = await axios.get('https://trioserver.onrender.com/api/v1/users/get-room-booking-history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const sortedBookings = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRoomBookings(sortedBookings);
      } catch (error) {
        console.error('Error fetching room bookings:', error);
        setnoOrder(true)
      }
    };

    fetchRoomBookings();
  }, []);

  const handleStarPress = async (star, hotelId) => {
    try {
      setIsRated(true);
      const jwtToken = await AsyncStorage.getItem("token");
      const response = await fetch(`https://trioserver.onrender.com/api/v1/cyrRating/create-ratings/${hotelId}`, {
        method: "POST",
        headers: new Headers({
          Authorization: "Bearer " + jwtToken,
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          "rating": star
        })
      });
      const data = await response.json();
      console.log("Done Rating Successfully", data);
    } catch (error) {
      console.log("Error in setting Ratings for Hotel", error);
      alert("Error in setting Ratings for Hotel: " + error.message);
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.bookingContainer}>
      <Text style={styles.bookingText}>Hotel: {item.hotel?.name}</Text>
      <Text style={styles.bookingText}>Total Bill: Rs {item.bill}</Text>
      <Text style={styles.bookingText}>Total Persons: {item.totalPerson}</Text>
      <Text style={styles.bookingText}>Rooms: {item.rooms}</Text>
      <Text style={styles.bookingText}>Booking Type: {item.orderType}</Text>
      {item.slotTiming && <Text style={styles.bookingText}>Slot Timing: {item.slotTiming}</Text>}
      <Text style={styles.bookingText}>Dates:</Text>
      {Object.keys(item.dates).map((date, index) => (
        <Text key={index} style={styles.dateText}>
          {date}: {item.dates[date] ? 'Booked' : 'Available'}
        </Text>
      ))}
      <Text style={styles.bookingText}>Booked On: {new Date(item.createdAt).toLocaleDateString()}</Text>
      <Text style={styles.bookingText}>Rate hotel below:</Text>
      <View style={{flexDirection:'row'}}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setRating(star);
                    handleStarPress(star, item.hotel?._id);
                  }}
                  disabled={isRated}
                >
                  <Icon
                    name="star"
                    size={30}
                    color={rating >= star ? 'yellow' : 'grey'}
                  />
                </TouchableOpacity>
              ))}
            </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Booking History</Text>
      {noOrder && (
            <Text style={styles.title}>No Room Booking History Yet</Text>
      )}
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
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#D32F2F',
  },
  bookingContainer: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    marginBottom: 16,
    elevation: 5,
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  bookingText: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 10,
  }
});

export default HotelOrderHistory;
