import React, { useState, useEffect, useRef } from 'react';
import { Button, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from '../Loading';
import ErrorPopup from '../ErrorPopup';

const { width, height } = Dimensions.get('window');

function Login(props) {
  // If null, no SMS has been sent
  const { token, mobileNo, Userdata } = props.route.params;
  console.log("Userdata", Userdata.user);

  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [confirm, setConfirm] = useState(null);

  const [loading, setLoading] = useState(false);

  // verification code (OTP - One-Time-Passcode)
  const [code, setCode] = useState('');

  // Handle login
  async function onAuthStateChanged(user) {
    console.log("User", user);
    if (user) {
      console.log('Success Login');
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    console.log("+91 " + mobileNo);
    signInWithPhoneNumber("+91 " + mobileNo);
  }, [])

  // Handle the button press
  async function signInWithPhoneNumber(phoneNumber) {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirm(confirmation);
  }

  async function confirmCode() {
    try {
      setLoading(true);
      console.log(code);
      await confirm.confirm(code);
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("Userdata", JSON.stringify(Userdata.user));
      props.navigation.replace('MainApp');
    } catch (error) {
      console.log('Invalid code.');
      setErrorMessage('Invalid code.');
      setErrorVisible(true);
    }
    finally{
      setLoading(false)
    }
  }

  const inputs = Array(6).fill(0);
  const inputRefs = inputs.map((_, index) => useRef(null));

  const focusInput = (index) => {
    if (index < inputs.length - 1 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && index > 0 && !inputs[index]) {
      inputRefs[index - 1].current.focus();
    }
  };

  if(loading){
    return <Loading />
  }

  return (
    <ScrollView style={{ backgroundColor: 'white' }}>
       <View style={styles.customShape}>
        <Text style={styles.loginText}>Login</Text>
      </View>
      <Text style={[styles.text, { textAlign: 'center', marginTop: height*0.47, color: 'darkblue' }]}>Enter OTP</Text>
      <View style={styles.container}>
        {inputs.map((_, index) => (
          <TextInput
            key={index}
            style={styles.input}
            maxLength={1}
            keyboardType="numeric"
            onChangeText={(value) => {
              setCode(code+value);
              console.log(code);
              inputs[index] = value;
              if (value !== '') {
                focusInput(index);
              }
            }}
            onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
            ref={inputRefs[index]}
          />
        ))}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => confirmCode()}>
        <Text style={styles.text}>Confirm</Text>
      </TouchableOpacity>
         <ErrorPopup
                visible={errorVisible}
                message={errorMessage}
                onClose={() => setErrorVisible(false)}
            />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 30
  },
  customShape: {
    position: 'absolute',
    top: -height * 0.1, // Move it further up to push top side off-screen
    left: -width * 0.1, // Move it further left to push left side off-screen
    width: width * 1, // Diameter of the ball-like shape
    height: height * 0.5, // Diameter of the ball-like shape
    backgroundColor: '#0A4BA1',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-15deg' }], // Optional: rotation to create a slant effect
    borderTopLeftRadius: height * 9,
    borderTopRightRadius: height * 4,
    borderBottomRightRadius: height * 9,
    borderBottomLeftRadius: height * 4,
},
loginText: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
    marginTop: 40,
    transform: [{ rotate: '15deg' }]
},
  input: {
    borderRadius: 15,
    width: 50,
    height: 80,
    textAlign: 'center',
    fontSize: 22,
    backgroundColor: 'darkblue',
    color: 'white'
  },
  text: {
    color: "white",
    fontSize: 30,
    fontWeight: '700'
  },
  button: {
    borderRadius: 20, // Make it circular by using half of the button's height
    backgroundColor: 'darkblue', // Change the background color as needed
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: width / 2,
    marginHorizontal: width / 4,
    marginTop: 50
  },
});

export default Login
