import React, { useState } from 'react';
import { TouchableOpacity, Dimensions, StyleSheet, Text, TextInput, View, Image, ScrollView, Button,
   Modal, 
   KeyboardAvoidingView} from 'react-native';
import Loading from '../Loading';
import ErrorPopup from '../ErrorPopup';
import auth from '@react-native-firebase/auth';
import Icon from "react-native-vector-icons/FontAwesome6";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

GoogleSignin.configure({
  webClientId: '579774610265-3bk1mgraq768pcdtip2p90oiiidre8fo.apps.googleusercontent.com',
});

const { width, height } = Dimensions.get("window");

function RegisterType(props) {

    const [email, setemail] = useState("");
    const [loading, setloading] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
  

    const Login = async() => {
        if(email == ""){
          setErrorMessage('Email Id. is required.');
          setErrorVisible(true);
            return
        }
        setloading(true);
        console.log(email)
        const generatedOtp = Math.floor(100000 + Math.random() * 900000);
       await fetch("https://trioserver.onrender.com/api/v1/users/login",{
            method:"POST",
            headers:{
              'Content-Type': 'application/json'
            },
            body:JSON.stringify({
              "email":email,
              "otp": generatedOtp
            })
          })
          .then(res=>res.json())
          .then(async(data)=>{
          console.log(data);
            try {
              console.log(data.data.accessToken);
              if(data.data.accessToken) {
                setloading(false);
                props.navigation.push('Login', {token: data.data.accessToken, email, Userdata: data.data, otp: generatedOtp});
              }
              else{
                setloading(false);
                setErrorMessage(data.data);
                setErrorVisible(true);
              }
            } catch (error) {
              setloading(false);
              console.log("Error in Login", error);
              setErrorMessage(error);
              setErrorVisible(true);
            }
          })
    }

    async function onGoogleButtonPress() {
      try {
        // Check if your device supports Google Play
        
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        // Get the user's ID token
        const { idToken } = await GoogleSignin.signIn();
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        setloading(true)
        const userCredential = await auth().signInWithCredential(googleCredential);
        // Get the user details from the signed-in user
        const { user } = userCredential;
        
        // Access user details
      // Check if phone number is missing and update the state
      if (!user.phoneNumber) {
        setloading(false)
        setUserDetails({
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          providerId: user.providerId,
        });
        setIsModalVisible(true);
      } else {
        const details = {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          providerId: user.providerId,
        };
        setUserDetails(details);
        console.log('User details:', details);
        // Save to database or proceed as necessary
        const namePart = userDetails.name.replace(/\s+/g, '').toLowerCase();
        // Generate a random number or string for uniqueness
        const randomPart = Math.floor(Math.random() * 10000); // Example: a number between 0-9999
        // Combine the name part with the random part
        const username = `${namePart}${randomPart}`;
        
        // Create a JSON object with the data
        const jsonData = {
            profileImg: userDetails.photoURL,
            fullName: userDetails.name,
            username: username,
            email: userDetails.email,
            password: userDetails.uid,
            mobileNo: userDetails.phoneNumber,
        };
        
        console.log(jsonData);
        
        try {
            const response = await axios.post("https://trioserver.onrender.com/api/v1/users/google-register", jsonData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Response:', response.data);
            if (data.data.accessToken) {
              await AsyncStorage.setItem("token", data.data.accessToken);
              await AsyncStorage.setItem("Userdata", JSON.stringify(data.data.user));
              setloading(false)
              props.navigation.replace("MainApp");
          } else {
            setloading(false)
              setErrorMessage(data.data);
              setErrorVisible(true);
          }
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
        }
        }
      } catch (error) {
        setloading(false)
        console.error('Google Sign-In Error:', error);
        // Handle error, show an error message to the user if necessary
      } finally{
        setloading(false)
      }
    }

      // Handle the phone number submission
      const handlePhoneNumberSubmit = async() => {
        // Create a new object with updated phone number
        const updatedUserDetails = { ...userDetails, phoneNumber };
      
        // Update the user details state and wait for it to complete
        setUserDetails(updatedUserDetails);
      
        // Use a callback to ensure the state update has occurred
        setUserDetails(async(prevDetails) => {
          const updatedDetails = { ...prevDetails, phoneNumber };
          console.log('User details with phone number:', updatedDetails);
      
          // Prepare FormData
          const namePart = userDetails.name.replace(/\s+/g, '').toLowerCase();
          // Generate a random number or string for uniqueness
          const randomPart = Math.floor(Math.random() * 10000); // Example: a number between 0-9999
          // Combine the name part with the random part
          const username = `${namePart}${randomPart}`;
          
          // Create a JSON object with the data
          const jsonData = {
              profileImg: userDetails.photoURL,
              fullName: userDetails.name,
              username: username,
              email: userDetails.email,
              password: userDetails.uid,
              mobileNo: updatedDetails.phoneNumber,
          };
          
          console.log(jsonData);
          
          try {
            setloading(true)
              const response = await axios.post("https://trioserver.onrender.com/api/v1/users/google-register", jsonData, {
                  headers: {
                      'Content-Type': 'application/json',
                  },
              });
              console.log('Response:', response.data);
              const data = response.data;
              console.log(data);
      
              if (data.data.refreshToken) {
                  await AsyncStorage.setItem("token", data.data.refreshToken);
                  await AsyncStorage.setItem("Userdata", JSON.stringify(data.data.user));
                  setloading(false)
                  props.navigation.replace("MainApp");
              } else {
                  setloading(false)
                  setErrorMessage(data.data);
                  setErrorVisible(true);
              }
          } catch (error) {
              console.error('Error:', error.response ? error.response.data : error.message);
          }
        });
      };      

    if (loading) {
      return (
       <Loading />
      );
    }

    return (
        <ScrollView style={{ backgroundColor: '#68095f' }}>
            <Image source={require('../../assets/Logo/TiofyDashboard.png')}
             style={{width: width/1.5, height:height/2.5, marginHorizontal: width/6}} />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder='Email'
                    onChangeText={(text)=>{
                        setemail(text)
                    }}
                    value={email}
                    placeholderTextColor={'white'}
                />
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={Login} >
                <Text style={styles.text}>Login</Text>
            </TouchableOpacity>
            <Text style={[styles.text, {textAlign: 'center', marginTop:10, color:'white'}]}>OR</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => { props.navigation.push('Signup') }} >
                <Text style={styles.text}>Signup</Text>
            </TouchableOpacity>

      <TouchableOpacity style={styles.googlebutton}
       onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}>
      <View style={styles.iconWrapper}>
        <Icon name="google" size={24} color="black" />
      </View>
      <Text style={styles.buttonText}>Sign in with Google</Text>
    </TouchableOpacity>

           {/* <TouchableOpacity onPress={()=>{props.navigation.replace("MainApp")}}>
            <Text style={{color: 'grey', fontSize:20, textAlign: 'center', marginTop: 20}}>Skip</Text>
            </TouchableOpacity> */}
            <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter your mobile number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handlePhoneNumberSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
            <ErrorPopup
                visible={errorVisible}
                message={errorMessage}
                onClose={() => setErrorVisible(false)}
            />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        borderBottomWidth: 3,
        borderBottomColor: 'white',
        width: width / 1.5,
        marginHorizontal: width / 6,
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    input: {
        color: "white",
        fontSize: 20,
        width: width/1.5,
        fontWeight: '600'
    },
    text: {
        color: "white",
        fontSize: 20,
        fontWeight: '600'
    },
    button: {
        borderRadius: 20, // Make it circular by using half of the button's height
        backgroundColor: '#9f0d91', // Change the background color as needed
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: width/2,
        marginHorizontal: width/4,
        marginTop: 10
      },
      googlebutton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffff00', // Google blue color
        paddingVertical: 12,
        width: width-40,
        borderRadius: 4,
        elevation: 2,
        marginLeft: 20,
        marginTop: 20
      },
      iconWrapper: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      },
      buttonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        alignItems: 'center',
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'black'
      },
      textInput: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 20,
        padding: 8,
      },
      submitButton: {
        backgroundColor: '#4285F4',
        padding: 12,
        borderRadius: 8,
      },
      submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
      },
});


export default RegisterType
