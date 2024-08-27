import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Text, Image } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome6";
import Loading from '../Loading';
import { TextInput, Button } from 'react-native-paper';
import ErrorPopup from '../ErrorPopup';

const { width, height } = Dimensions.get("window");

function Signup(props) {

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [address, setAddress] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [alternateMobileNo, setAlternateMobileNo] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const [loading, setloading] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");


    const Signup = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('The email address is invalid.');
            setErrorVisible(true);
            return
        }

        const formData = new FormData();
        formData.append('profileImg', selectedImage,);
        formData.append("fullName", fullName);
        formData.append("username", username);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("address", address);
        formData.append("mobileNo", mobileNo);
        formData.append("alternateMobileNo", alternateMobileNo);
        console.log(formData);
        setloading(true)
       
          await fetch("https://trioserver.onrender.com/api/v1/users/register", {
            method: "POST",
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            body: formData
        })
            .then(res => res.json())
            .then(async (data) => {
                console.log(data);
                try {
                    console.log(data.data.accessToken);
                    if (data.data.accessToken) {
                        setloading(false);
                        await AsyncStorage.setItem("token", data.data.accessToken);
                        await AsyncStorage.setItem("Userdata", JSON.stringify(data.data.user));
                        props.navigation.pop();
                        props.navigation.replace("MainApp");
                    }
                    else {
                        setloading(false);
                        setErrorMessage(data.data);
                        setErrorVisible(true);
                    }
                } catch (error) {
                    setloading(false);
                    console.log("Error in SignUp", error);
                    setErrorMessage(error);
                    setErrorVisible(true);//Show the proper error with the help of message and received and use some code eg. 101 to identify the error          
             } 
  }) 
}

  const pickImage = async () => {
    try {
        const image = await ImagePicker.openPicker({
            width: 200,
            height: 200,
            cropping: true,
            includeBase64: true,
            cropperCircleOverlay: true,
            avoidEmptySpaceAroundImage: true,
            freeStyleCropEnabled: true,
            compressImageQuality: 0.8,
        });

        if (!image || !image.data) {
            setErrorMessage('Could not retrieve image data. Please try again.');
            setErrorVisible(true);
            throw new Error('Could not retrieve image data. Please try again.');
        }

        const data = `data:${image.mime};base64,${image.data}`;
        setSelectedImage(data);
    } catch (error) {
        setErrorMessage(error.message || 'An unexpected error occurred while picking the image.');
        setErrorVisible(true);
    }
};

    if (loading) {
        return (
            <Loading />
        );
    }

    return (
        <ScrollView style={{ backgroundColor: "white" }}>
            <View style={styles.customShape}>
        <Text style={styles.loginText}>Signup</Text>
      </View>
            <View style={[styles.inputContainer, { marginHorizontal: width / 6 }]}>
                {selectedImage && 
                    <Image
                        source={{ uri: selectedImage }}
                        style={styles.profile}
                    />
                }
                <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
                    <Text style={styles.buttonText}>Upload Profile Photo</Text>
                </TouchableOpacity>
                    <TextInput
                        label='Full Name'
                        value={fullName}
                        onChangeText={(text) => setFullName(text)}
                        mode="outlined"
                        theme={{
                            colors: {
                                primary: 'darkblue',
                                text: 'darkblue',
                                placeholder: 'darkblue'
                            }
                        }}
                        style={styles.input}
                    />
                {/* Repeat the above Animated.View for other TextInput fields */}
                {/* Username */}
                    <TextInput
                        label='Username'
                        value={username}
                        onChangeText={(text) => setUsername(text)}
                        mode="outlined"
                        theme={{
                            colors: {
                                primary: 'darkblue',
                                text: 'darkblue',
                                placeholder: 'darkblue'
                            }
                        }}
                        style={styles.input}
                    />
                {/* Email */}
                    <TextInput
                        label='Email'
                        value={email}
                        onChangeText={(text) => setEmail(text)}
                        mode="outlined"
                        theme={{
                            colors: {
                                primary: 'darkblue',
                                text: 'darkblue',
                                placeholder: 'darkblue'
                            }
                        }}
                        style={styles.input}
                    />
                {/* Password */}
                    <TextInput
                        label='Password'
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                        secureTextEntry={true}
                        mode="outlined"
                        theme={{
                            colors: {
                                primary: 'darkblue',
                                text: 'darkblue',
                                placeholder: 'darkblue'
                            }
                        }}
                        style={styles.input}
                    />
                {/* Address */}
                    <TextInput
                        label='Address'
                        value={address}
                        onChangeText={(text) => setAddress(text)}
                        mode="outlined"
                        theme={{
                            colors: {
                                primary: 'darkblue',
                                text: 'darkblue',
                                placeholder: 'darkblue'
                            }
                        }}
                        style={styles.input}
                    />
                {/* Mobile Number */}
                    <TextInput
                        label='Mobile No'
                        value={mobileNo}
                        onChangeText={(text) => setMobileNo(text)}
                        keyboardType='numeric'
                        mode="outlined"
                        theme={{
                            colors: {
                                primary: 'darkblue',
                                text: 'darkblue',
                                placeholder: 'darkblue'
                            }
                        }}
                        style={styles.input}
                    />
                {/* Alternate Mobile Number */}
                    <TextInput
                        label='Alternate Mobile No'
                        value={alternateMobileNo}
                        onChangeText={(text) => setAlternateMobileNo(text)}
                        keyboardType='numeric'
                        mode="outlined"
                        theme={{
                            colors: {
                                primary: 'darkblue',
                                text: 'darkblue',
                                placeholder: 'darkblue'
                            }
                        }}
                        style={styles.input}
                    />
            </View>

            <TouchableOpacity
                style={[styles.button, { marginHorizontal: width / 4, marginTop: 40 }]}
                onPress={Signup}>
                <Text style={styles.text}>Signup</Text>
            </TouchableOpacity>
            
            <View style={styles.footer}>
            <TouchableOpacity onPress={() => props.navigation.pop()}>
                <Text
                    style={{
                        color: 'black', // Change color of "Login" to make it stand out
                        fontWeight: '600',
                        textAlign: 'center',
                        marginTop: 10,
                        fontSize: 15,
                    }}
                >
                    Already Registered? <Text style={{ color: 'darkblue' }}>Login</Text>
                </Text>
            </TouchableOpacity>
        </View>
        <ErrorPopup
                visible={errorVisible}
                message={errorMessage}
                onClose={() => setErrorVisible(false)}
            />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
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
        fontSize: 35,
        fontWeight: 'bold',
        marginTop: 40,
        transform: [{ rotate: '15deg' }]
    },
    inputContainer: {
      marginTop: height*0.47
    },
    input: {
        backgroundColor: 'transparent',
        textAlign: 'left',
        width: width / 1.5,
        color: 'darkblue',
        fontSize: 18,
        marginTop: 15,
    },
    profile: {
        width: 150,
        height: 150,
        borderRadius: 80,
        borderColor: "black",
        borderWidth: 1,
        overflow: 'hidden',
        marginHorizontal: width / 9,
        marginTop: 20
    },
    uploadText: {
        textAlign: 'center',
        color: 'white',
        fontSize: 18,
        marginVertical: 20,
    },
    uploadButton: {
        backgroundColor: 'darkblue',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignSelf: 'center',
        marginTop: 10,
        color: 'white',
        width: width / 1.5
    },
    icon: {
        textAlign: 'center',
        marginTop: -30,
        marginBottom: 20
    },
    text: {
        color: "white",
        fontSize: 25,
        fontWeight: '700'
    },
    button: {
        borderRadius: 20,
        backgroundColor: 'darkblue',
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: width / 2
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center'
    },
    footer:{ 
       padding: 30
    }
});

export default Signup