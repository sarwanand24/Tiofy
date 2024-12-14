import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput,
     Alert, Modal } from 'react-native';
import { getAccessToken } from '../utils/auth';
import axios from 'axios';

const UserProfile = () => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [address, setAddress] = useState('');
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await AsyncStorage.getItem("token"); // Get the token from AsyncStorage
                if (!token) return console.error("Token not found");

                const response = await fetch('https://trioserver.onrender.com/api/v1/users/current-user', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data.data); // assuming `req.user` is returned under `data`
                    console.log("User Data:", data.data);
                } else {
                    console.error("Failed to fetch user data", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching user data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = await getAccessToken();
            if (token) {
                const response = await axios.put(
                    'https://trioserver.onrender.com/api/v1/users/update-details',
                    { email, mobileNo, address },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUserData(response.data.data);
                setIsEditing(false);
            }
        } catch (error) {
            setAlertMessage('The email or mobile number already exists, use a different one.');
            setAlertVisible(true);
            console.log('Error updating user data:', error);
        }finally{setLoading(false)}
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="white" />
            </View>
        ); // Show an ActivityIndicator while loading
    }

    const CustomAlert = ({ visible, onClose, message }) => (
        <Modal
          transparent={true}
          animationType="fade"
          visible={visible}
          onRequestClose={onClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>Oops!</Text>
              <Text style={styles.alertMessage}>{message}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );

      // Component to render each row
const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '-'}</Text>
    </View>
);

    return (
        <ScrollView style={styles.container}>
            {/* Profile Section */}
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: userData.profilePhoto?.replace('http://', 'https://') }}
                    style={styles.profileImage}
                />
                <Text style={styles.fullName}>{userData.fullName}</Text>
                <Text style={styles.username}>@{userData.username}</Text>
                <Text style={styles.createdAt}>Joined: {new Date(userData.createdAt).toLocaleDateString()}</Text>
            </View>

            {/* Contact Information Section */}
            <View style={styles.infoContainer}>
                <Text style={styles.sectionTitle}>Contact Info</Text>
                {isEditing ? (
                    <>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email:</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Mobile:</Text>
                            <TextInput
                                style={styles.input}
                                value={mobileNo}
                                onChangeText={setMobileNo}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Address:</Text>
                            <TextInput
                                style={styles.input}
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>
                    </>
                ) : (
                    <>
                        <InfoRow label="Email" value={userData.email} />
                        <InfoRow label="Mobile" value={userData.mobileNo} />
                        <InfoRow label="Address" value={userData.address || 'unknown'} /></>
                )}
            </View>

            {isEditing && (
                <TouchableOpacity
                    style={{ backgroundColor: '#9f0d91', marginVertical: 10, width: '60%', borderRadius: 20, padding: 8, marginHorizontal: 'auto' }}
                    onPress={handleSave}
                >
                    <Text style={{ textAlign: 'center', color: 'white' }}>Save</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={{ backgroundColor: '#9f0d91', marginVertical: 10, width: '60%', borderRadius: 20, padding: 8, marginHorizontal: 'auto' }}
                onPress={() => setIsEditing(!isEditing)}
            >
                <Text style={{ textAlign: 'center', color: 'white' }}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>

            {/* Location Section */}
            <View style={styles.infoContainer}>
                <Text style={styles.sectionTitle}>Location</Text>
                <InfoRow label="Latitude" value={userData.latitude} />
                <InfoRow label="Longitude" value={userData.longitude} />
            </View>

            {/* Favorite Foods Section */}
            <View style={styles.infoContainer}>
                <Text style={styles.sectionTitle}>Favorite Foods</Text>
                {userData.favouriteFoods && userData.favouriteFoods.length > 0 ? (
                    userData.favouriteFoods.map((food, index) => (
                        <Text key={index} style={styles.favFood}>{food}</Text>
                    ))
                ) : (
                    <Text style={styles.noData}>No favorite foods added.</Text>
                )}
            </View>

            {/* Refresh Token Section */}
            <View style={styles.infoContainer}>
                <Text style={styles.sectionTitle}>Refresh Token</Text>
                <Text style={styles.token}>{userData.refreshToken}</Text>
            </View>

            <CustomAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        message={alertMessage}
      />

        </ScrollView>
    );
};

// Define styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#68095f',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#68095f',
    },
    profileContainer: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    fullName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffff00',
        marginBottom: 5,
    },
    username: {
        fontSize: 16,
        color: 'white',
        marginBottom: 5,
    },
    createdAt: {
        fontSize: 14,
        color: 'white',
    },
    infoContainer: {
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
        backgroundColor: '#9f0d91',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#ddd',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    label: {
        fontSize: 14,
        color: '#ffff00',
        fontWeight: '600',
        padding: 5
    },
    value: {
        fontSize: 14,
        color: 'white',
    },
    favFood: {
        fontSize: 14,
        color: 'white',
        marginVertical: 5,
        paddingLeft: 5,
    },
    noData: {
        fontSize: 14,
        color: '#ffff00',
    },
    token: {
        fontSize: 12,
        color: 'white',
        marginVertical: 10,
        backgroundColor: '#9f0d91',
        padding: 10,
        borderRadius: 8,
        wordBreak: 'break-word',
    },
    inputContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8
    },
    input: {
        backgroundColor: '#9f0d91',
        color: 'white',
        width: '80%',
        borderRadius: 20
    },
    updateButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      alertContainer: {
        width: 300,
        backgroundColor: '#9f0d91',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
      },
      alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#ffff00',
      },
      alertMessage: {
        fontSize: 16,
        textAlign: 'center',
        color: 'white',
        marginBottom: 20,
      },
      closeButton: {
        backgroundColor: '#ffff00',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
      },
      closeButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
      },
});

export default UserProfile;
