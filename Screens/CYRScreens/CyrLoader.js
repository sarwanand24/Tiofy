import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import LottieView from 'lottie-react-native';

const CyrLoader = () => {

    return (
        <View style={styles.loading}>
           <LottieView source={require('../../assets/Animations/CyrLoader.json')}
           style={styles.lottie} autoPlay loop />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    lottie: {
        width: '100%',
        height: '100%',
      }
});

export default CyrLoader;
