import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const HotelRatingSummary = ({ hotelId }) => {  // Pass hotelId as a prop
  const [groupedRatings, setGroupedRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupedRatings = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`https://01e9-2402-3a80-4378-bc2f-c481-96f5-f8f6-8695.ngrok-free.app/api/v1/hotelRating/get-grouped-ratings/${hotelId}`);
        setGroupedRatings(response.data.data); // Set the grouped ratings to state
      } catch (error) {
        console.error('Error fetching grouped ratings:', error);
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
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hotel Ratings</Text>
      {groupedRatings.length > 0 ? (
        <FlatList
          data={groupedRatings}
          renderItem={renderRatingGroup}
          keyExtractor={(item) => item._id.toString()}
        />
      ) : (
        <Text>No ratings available for this hotel.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  ratingGroup: {
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    color: '#555',
  },
});

export default HotelRatingSummary;
