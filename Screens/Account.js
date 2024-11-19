import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

const Account = () => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        ); // Show an ActivityIndicator while loading
    }

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
                <InfoRow label="Email" value={userData.email} />
                <InfoRow label="Mobile" value={userData.mobileNo} />
            </View>

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
        </ScrollView>
    );
};

// Component to render each row
const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '-'}</Text>
    </View>
);

// Define styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
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
        color: '#333',
        marginBottom: 5,
    },
    username: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    createdAt: {
        fontSize: 14,
        color: '#999',
    },
    infoContainer: {
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#444',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
        backgroundColor: '#fff',
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
        color: '#333',
        fontWeight: '600',
    },
    value: {
        fontSize: 14,
        color: '#555',
    },
    favFood: {
        fontSize: 14,
        color: '#333',
        marginVertical: 5,
        paddingLeft: 5,
    },
    noData: {
        fontSize: 14,
        color: '#888',
    },
    token: {
        fontSize: 12,
        color: '#444',
        marginVertical: 10,
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        wordBreak: 'break-word',
    }
});

export default Account;
