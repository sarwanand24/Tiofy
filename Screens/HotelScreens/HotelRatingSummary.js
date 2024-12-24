import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import axios from 'axios';

const HotelRatingSummary = ({ hotelId }) => {  // Pass hotelId as a prop
  const [groupedRatings, setGroupedRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupedRatings = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`https://trioserver.onrender.com/api/v1/hotelRating/get-grouped-ratings/${hotelId}`);
        setGroupedRatings(response.data.data); // Set the grouped ratings to state
      } catch (error) {
        console.log('Error fetching grouped ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupedRatings();
  }, [hotelId]); // Re-run the effect if hotelId changes

  const renderRatingGroup = ({ item }) => (
    <View style={styles.ratingGroup}>
      <Text style={styles.ratingText}>{item._id} Stars</Text>
      <View style={styles.ratingLine}>
        <View style={[styles.ratingBar, { width: `${(item.count / 10) * 100}%` }]} />
      </View>
      <Text style={styles.ratingCount}>{item.count} Ratings</Text>
    </View>
  );

  if (loading) {
    return <Text style={{color:'#ffff00', textAlign:'center'}}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
         <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      <Text style={styles.title}>Hotel Ratings</Text>
      {groupedRatings.length > 0 ? (
        <FlatList
          data={groupedRatings}
          renderItem={renderRatingGroup}
          keyExtractor={(item) => item._id.toString()}
        />
      ) : (
        <Text style={{color:'white'}}>No ratings available for this hotel.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#9f0d91',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ffff00',
  },
  ratingGroup: {
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  ratingLine: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginVertical: 8,
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FF5722',
    borderRadius: 3,
  },
  ratingCount: {
    fontSize: 14,
    color: 'white',
  },
});

export default HotelRatingSummary;
