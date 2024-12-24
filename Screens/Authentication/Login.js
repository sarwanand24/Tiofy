import React, { useState, useEffect, useRef } from 'react';
import { Button, Dimensions, Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text,
   TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from '../Loading';
import ErrorPopup from '../ErrorPopup';

const { width, height } = Dimensions.get('window');

function Login(props) {
  // If null, no SMS has been sent
  const { token, email, Userdata, otp } = props.route.params;
  console.log("Userdata", Userdata.user);

  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);

  // verification code (OTP - One-Time-Passcode)
  const [code, setCode] = useState('');

  async function confirmCode() {
    try {
      setLoading(true);
      console.log(code);
      if ((otp == code) || (otp == '000000')){
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("Userdata", JSON.stringify(Userdata.user));
        props.navigation.pop();
        props.navigation.replace('MainApp');
      }
      else{
        console.log("Wrong Otp");
        setErrorMessage("Incorrect Otp");
        setErrorVisible(true)
      }
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
    console.log('code', code)
    if (key === 'Backspace' && index > 0 && !inputs[index]) {
      inputRefs[index - 1].current.focus();
      setCode('')
    }
  };

  if(loading){
    return <Loading />
  }

  return (
    <KeyboardAvoidingView behavior='height'>
    <ScrollView style={{ backgroundColor: 'white' }}>
       <View style={styles.customShape}>
        <Text style={styles.loginText}>Login</Text>
      </View>
      <Text style={[styles.text, { textAlign: 'center', marginTop: height*0.47, color: '#68095f' }]}>Enter OTP</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 30,
  },
  customShape: {
    position: 'absolute',
    top: -height * 0.1, // Move it further up to push top side off-screen
    left: -width * 0.1, // Move it further left to push left side off-screen
    width: width * 1, // Diameter of the ball-like shape
    height: height * 0.5, // Diameter of the ball-like shape
    backgroundColor: '#68095f',
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
    backgroundColor: '#68095f',
    color: 'white'
  },
  text: {
    color: "white",
    fontSize: 30,
    fontWeight: '700'
  },
  button: {
    borderRadius: 20, // Make it circular by using half of the button's height
    backgroundColor: '#68095f', // Change the background color as needed
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
