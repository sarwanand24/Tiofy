import LottieView from 'lottie-react-native'
import React from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'

const { width, height } = Dimensions.get('window');

function RiderSearchLoader() {
    return (
        <View style={styles.container3}>
            <Text style={styles.mainMessage}>
               Searching For Your Rider
            </Text>
            <LottieView
                source={require('../../assets/Animations/RiderSearch.json')}
                style={styles.lottie2}
                autoPlay
                loop
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container3: {
        flex: 1,
        backgroundColor: '#f7f7f7', // Light, neutral background color
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mainMessage: {
        fontSize: 22,
        color: '#2c3e50', // Dark color for contrast
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    subMessage: {
        fontSize: 18,
        color: '#7f8c8d', // Slightly lighter color for the secondary message
        textAlign: 'center',
        marginBottom: 30,
    },
    lottie2: {
        width: width * 0.7, // Large enough to be noticeable but not overwhelming
        height: height * 0.4, // Adjust height to maintain aspect ratio
    },
})

export default RiderSearchLoader
