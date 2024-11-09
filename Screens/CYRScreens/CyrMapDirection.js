import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Icon from "react-native-vector-icons/FontAwesome6";
import AsyncStorage from '@react-native-async-storage/async-storage';
import polyline from '@mapbox/polyline';

const { width, height } = Dimensions.get('window');

const CyrMapDirection = (props) => {
  const { orderId, socket, userId } = props.route.params;

  const [mapInfo, setMapInfo] = useState({
    User: { lat: 0, long: 0 },
    destination: { lat: 0, long: 0 },
    Rider: { latitude: 0, longitude: 0, heading: 0 }
  });
  const [details, setDetails] = useState([]);
  const [riderId, setRiderId] = useState('');
  const [rating, setRating] = useState(0);
  const [isRated, setIsRated] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);

  const fetchMapDetails = async () => {
    try {
      const response = await fetch(`https://trioserver.onrender.com/api/v1/cyrOrder/order/${orderId}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.data) {
        const orderData = data.data;
        const userLatLng = orderData.fromLocation || { lat: 0, long: 0 };
        const destination = orderData.toLocation || { lat: 0, long: 0 };
        const riderLatLng = orderData.Rider[0] || { lat: 0, long: 0 };
        setMapInfo({
            User: {
                lat: userLatLng.lat,
                long: userLatLng.long
              },
              destination: {
                lat: destination.lat,
                long: destination.long
              },
              Rider: {
                latitude: riderLatLng.latitude,
                longitude: riderLatLng.longitude,
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
      const { latitude, longitude, heading } = data;
      console.log(latitude, longitude, heading);
      setMapInfo(prevState => ({
        ...prevState,
        Rider: { latitude, longitude, heading }
      }));
    };

      socket.on("CurrentLocationofRiderToUser", handleLocationUpdate);

    return () => {
        socket.off("CurrentLocationofRiderToUser", handleLocationUpdate);
    };
  }, [socket, userId]);

  const fetchRoute = async () => {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${mapInfo.Rider.longitude},${mapInfo.Rider.latitude};${mapInfo.destination.long},${mapInfo.destination.lat}?overview=full`);
      const data = await response.json();
      const encodedPolyline = data.routes[0].geometry;
      const distance = data.routes[0].distance;
      const duration = data.routes[0].duration;

      if (distance === 0 || duration === 0) {
        console.warn('The start and end locations are the same or too close to calculate a meaningful route.');
        return;
      }

      setRouteDistance(distance);
      setRouteDuration(duration);

      const coordinates = polyline.decode(encodedPolyline).map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));

      setRouteCoordinates(coordinates);
    } catch (error) {
      console.log('Error fetching route:', error);
    }
  };

  useEffect(() => {
      fetchRoute();
  }, [mapInfo.Rider, socket]);

  const handleStarPress = async (star) => {
    try {
      setIsRated(true);
      const jwtToken = await AsyncStorage.getItem("token");
      const response = await fetch(`https://trioserver.onrender.com/api/v1/cyrRating/create-ratings/${details.Rider[0]._id}`, {
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.detailsBox}>
        <Text style={styles.orderStatus}>{details.rideStatus ? details.rideStatus : 'Your Beloved Rider is on the way'}</Text>
        {routeDistance && routeDuration && (
          <View style={styles.routeInfo}>
            <Text style={styles.infoText}>Distance: {(routeDistance / 1000).toFixed(2)} km</Text>
            <Text style={styles.infoText}>Duration: {(routeDuration / 60).toFixed(0)} mins</Text>
          </View>
        )}
      </View>

      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={{
          latitude: mapInfo.User.lat,
          longitude: mapInfo.User.long,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        customMapStyle={[]}
        tileOverlay={{
          urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maximumZ: 19,
        }}
      >
     
     <Marker
          coordinate={{ latitude: mapInfo.Rider.latitude, longitude: mapInfo.Rider.longitude }}
          title={'Rider'}
          description={'Current location of the rider'}
        >
          <Image source={require('../../assets/bike.png')}
            style={[
              styles.markerImage,
              {
                transform: [{ rotate: `${mapInfo?.Rider.heading}deg` }]
              }
            ]} />
        </Marker>
        <Marker
          coordinate={{ latitude: mapInfo.User.lat, longitude: mapInfo.User.long }}
          title={'PickupLocation'}
          description={'Location of the user'}
        >
          <Image source={require('../../assets/person.png')} style={styles.markerImage} />
        </Marker>
        <Marker
          coordinate={{ latitude: mapInfo.destination.lat, longitude: mapInfo.destination.long }}
          title={'User'}
          description={'Location of the destination'}
        >
          <Image source={require('../../assets/person.png')} style={styles.markerImage} />
        </Marker>
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="blue"
            strokeWidth={5}
          />
        )}
      </MapView>

        <View style={styles.rating}>
          <Image
            source={{
              uri: details.Rider && details.Rider[0]?.profilePhoto
                ? details.Rider[0].profilePhoto.replace("http://", "https://")
                : 'https://image.api.playstation.com/vulcan/img/rnd/202010/2621/H9v5o8vP6RKkQtR77LIGrGDE.png'
            }}
            style={styles.ratingImage} />
          <View style={styles.rateTextContainer}>
            <Text style={styles.rateRider}>{details.Rider ? `${details.Rider[0]?.riderName} is your captain` : 'Fetching...'}</Text>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.rateRider}>{details.Rider ? `+91 ${details.Rider[0]?.mobileNo}` : 'Fetching...'}{`\u00A0`} {`\u00A0`}</Text>
              <Icon
                name="star"
                size={18}
                color={'grey'}
              />
              <Text style={styles.rateRider}>{details.Rider ? `(${(details.Rider[0]?.cyrRatings).toFixed(1)})` : 'Fetching...'}</Text>
            </View>
            <View style={styles.ratingContainer}>
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
                    color={rating >= star ? 'yellow' : 'grey'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.rateRider}>{details.otp ? `Share this OTP with rider to begin your journey: ${details.otp}` : 'Loading...'}</Text>
          </View>
        </View>
    </ScrollView>
  );
};

export default CyrMapDirection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    flex: 3,
    width: width,
    height: height * 0.5,
  },
  markerImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  detailsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'lightblue',
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  restaurantName: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    padding: 10,
  },
  orderStatus: {
    fontSize: 18,
    color: 'white',
    paddingBottom: 10
  },
  routeInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'pink',
    alignItems: 'center',
    borderRadius: 20
  },
  infoText: {
    fontSize: 16,
    paddingHorizontal: 10,
  },
  rating: {
    backgroundColor: '#b0c4de', // Clay blue background color
    padding: 20,               // Padding around the entire container
    borderRadius: 10,                // Margin around the container      
  },
  ratingImage: {
    width: 60,                 // Adjust the width of the profile image
    height: 60,                // Adjust the height of the profile image
    borderRadius: 30,          // Make the image circular
    marginBottom: 10,          // Space between the image and text
  },
  rateTextContainer: {
    marginBottom: 10,          // Space between the rating container and the button
  },
  rateRider: {
    color: '#FFFFFF',          // White text color
    fontSize: 16,              // Font size for the rider name text
    fontWeight: 'bold',        // Make the text bold
    marginBottom: 10,          // Space between the rider name and stars
  },
  ratingContainer: {
    flexDirection: 'row',         // Space between the stars and the button
  },
  submitButton: {
    color: '#FFFFFF',          // White text color
    fontSize: 16,              // Font size for the submit button
    fontWeight: 'bold',        // Make the text bold
    textAlign: 'center',       // Center-align the text
    padding: 10,               // Padding inside the button
    backgroundColor: '#4682b4', // Optional: Different background color for the button
    borderRadius: 5,           // Rounded corners for the button
  },
});
