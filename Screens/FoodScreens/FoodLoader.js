import React from 'react';
import {
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';
import LottieView from 'lottie-react-native';

const FoodLoader = () => {

    return (
        <View style={styles.loading}>
           <LottieView source={require('../../assets/Animations/FoodLoader.json')}
           style={styles.lottie} autoPlay loop />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#68095f'
    },
    lottie: {
        width: '100%',
        height: '100%',
      }
});

export default FoodLoader;
