import React from 'react';
import {
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';
import LottieView from 'lottie-react-native';

const Loading = () => {

    return (
        <View style={styles.loading}>
               <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
           <LottieView source={require('../assets/Animations/loading.json')}
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

export default Loading;
