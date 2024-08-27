import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Icon from "react-native-vector-icons/FontAwesome6";
import AsyncStorage from '@react-native-async-storage/async-storage';
import polyline from '@mapbox/polyline';

const { width, height } = Dimensions.get('window');

const MapDirection = (props) => {
  const { orderId, socket, riderId, userId } = props.route.params;

  const [mapInfo, setMapInfo] = useState({
    User: { latitude: 0, longitude: 0 },
    Restaurant: { latitude: 0, longitude: 0 },
    Rider: { latitude: 0, longitude: 0, heading: 0 }
  });
  const [details, setDetails] = useState([]);
  const [rating, setRating] = useState(0);
  const [isRated, setIsRated] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);

  const fetchMapDetails = async () => {
    try {
      const response = await fetch(`https://trioserver.onrender.com/api/v1/foodyOrder/order/${orderId}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.data.length > 0) {
        const orderData = data.data[0];
        setMapInfo({
          User: {
            latitude: orderData.User[0].latitude,
            longitude: orderData.User[0].longitude
          },
          Restaurant: {
            latitude: orderData.Restaurant[0].latitude,
            longitude: orderData.Restaurant[0].longitude
          },
          Rider: {
            latitude: orderData.Rider[0].latitude,
            longitude: orderData.Rider[0].longitude,
            heading: 0 // Default heading
          }
        });
        setDetails(orderData);
      }
    } catch (error) {
      console.log("Error in fetching Map Details", error);
      alert("Error in fetching Map Details: " + error.message);
    }
  };

  useEffect(() => {
    fetchMapDetails();
  }, []);

  useEffect(() => {
    const handleLocationUpdate = (data) => {
      // if (data.userId === userId) {
        const { latitude, longitude, heading } = data;
        console.log(latitude, longitude, heading );
        setMapInfo(prevState => ({
          ...prevState,
          Rider: { latitude, longitude, heading }
        }));
      // }
    };
  
    socket.on("CurrentLocationofRiderToUser", handleLocationUpdate);
  
    return () => {
      socket.off("CurrentLocationofRiderToUser", handleLocationUpdate);
    };
  }, [socket, userId]);

  const handleStarPress = async (star) => {
    try {
      setIsRated(true);
      const jwtToken = await AsyncStorage.getItem("token");
      const response = await fetch(`https://trioserver.onrender.com/api/v1/cyrRating/create-ratings/${riderId}`, {
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
      console.log("Error in setting Ratings for Rider", error);
      alert("Error in setting Ratings for Rider: " + error.message);
    }
  };

  const fetchRoute = async () => {
    try {
      console.log('startend');
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${mapInfo.User.longitude},${mapInfo.User.latitude};${mapInfo.Rider.longitude},${mapInfo.Rider.latitude}?overview=full`);
      const data = await response.json();
      const encodedPolyline = data.routes[0].geometry;
      const distance = data.routes[0].distance; // Distance in meters
      const duration = data.routes[0].duration; // Duration in seconds
      setRouteDistance(distance);
      setRouteDuration(duration);
      console.log(encodedPolyline);
      const coordinates = polyline.decode(encodedPolyline).map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));
      console.log('Distance:', distance, 'meters');
      console.log('Duration:', duration, 'seconds');
      setRouteCoordinates(coordinates);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  useEffect(()=>{
    fetchRoute();
  },[mapInfo.Rider, socket])

  return (
    <View style={styles.container}>
      <View style={styles.detailsBox}>
        <Text style={styles.restaurantName}>{details.Restaurant ? details.Restaurant[0].restaurantName : 'Fetching'}</Text>
        <Text style={styles.orderStatus}>Your Order is on the way</Text>
      </View>

      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={{
          latitude: mapInfo.User.latitude,
          longitude: mapInfo.User.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        customMapStyle={[]}
        tileOverlay={{
          urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maximumZ: 19,
        }}
      >
        <Marker coordinate={mapInfo.User} title="User" description="User Location">
          <Image source={require('../../assets/person.png')} style={styles.markerImage} />
        </Marker>
        {mapInfo.Rider && (
          <>
            <Marker coordinate={mapInfo.Rider} title="Rider" description="Rider Location">
              <Image source={require('../../assets/bike.png')}
                style={[
                  styles.markerImage,
                  {
                    transform: [{ rotate: `${mapInfo.Rider.heading}deg` }] // Apply rotation based on heading
                  }
                ]} />
            </Marker>
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#00BFFF"
                strokeWidth={5}
              />
            )}
          </>
        )}
      </MapView>

      {routeDistance && routeDuration && (
            <View style={styles.routeInfo}>
              <Text style={styles.infoText}>Distance: {(routeDistance / 1000).toFixed(2)} km</Text>
              <Text style={styles.infoText}>Duration: {(routeDuration / 60).toFixed(0)} mins</Text>
            </View>
          )}

      <View style={styles.rating}>
        <Image 
       source={{
        uri: details.Rider && details.Rider[0].profilePhoto
          ? details.Rider[0].profilePhoto.replace("http://", "https://")
          : 'https://image.api.playstation.com/vulcan/img/rnd/202010/2621/H9v5o8vP6RKkQtR77LIGrGDE.png'
      }}
          style={styles.riderImage} />
        <View style={styles.ratingTextContainer}>
          <Text style={styles.riderName}>{details.Rider ? details.Rider[0].riderName : 'Fetching'} is your delivery partner</Text>
          <Text style={styles.riderContact}>
            +91 {details.Rider ? details.Rider[0].mobileNo : ''}{' '}
            <Icon name="star" size={25} color="gold" /> {details.Rider ? details.Rider[0].cyrRatings : '0.0'}
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  setRating(star);
                  handleStarPress(star);
                }}
                disabled={isRated}
              >
                <Icon
                  name="star"
                  size={30}
                  color={star <= rating ? '#FFD700' : '#D3D3D3'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  detailsBox: {
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  restaurantName: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderStatus: {
    color: '#fff',
    fontSize: 16,
  },
  map: {
    flex: 1,
    height: height * 0.6,
  },
  markerImage: {
    width: 40,
    height: 40,
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#282828',
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  infoText: {
    color: '#00BFFF',
    fontSize: 16,
  },
  rating: {
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  riderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  ratingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  riderName: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  riderContact: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  routeInfo: {
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderColor: '#FF33FF',
    borderWidth: 1,
    borderRadius: 5,
    margin: 10,
  },
  infoText: {
    color: '#FF5733',
    fontSize: 16,
  },
});

export default MapDirection;
