import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import "core-js/stable/atob";

// Function to check if the token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = jwtDecode(token);
  console.log('decoded', decoded);
  const { exp } = decoded;
  return Date.now() >= exp * 1000;
};

// Function to refresh the token
export const refreshToken = async () => {
  try {
    const StringUserdata = await AsyncStorage.getItem("Userdata");
    const Userdata = JSON.parse(StringUserdata);
    
    const response = await axios.post('https://trioserver.onrender.com/api/v1/users/refresh-token', {
       user: Userdata._id,
    });
    await AsyncStorage.setItem('token', response.data.data.refreshToken);
    return response.data.data.refreshToken;
  } catch (error) {
    console.error('Failed to refresh token', error);
    // Handle error (e.g., redirect to login)
  }
};

// Function to get the access token
export const getAccessToken = async () => {
  let token = await AsyncStorage.getItem('token');
  let user = await AsyncStorage.getItem('Userdata')
  console.log('token 23', token);
  console.log('user 23', user);
  if (isTokenExpired(token)) {
    token = await refreshToken();
  }
  return token;
};
