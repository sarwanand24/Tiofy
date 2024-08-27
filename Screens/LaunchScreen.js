import React, { useState, useEffect } from 'react';
import { View, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width, height} = Dimensions.get('window');

function LaunchScreen(props) {

    const fetchData = async () => {
        try {
          const token = await AsyncStorage.getItem("token");  
          await new Promise(resolve => setTimeout(resolve, 3000));
            if(token){
              props.navigation.replace("MainApp");
            }
            else{
              props.navigation.replace("RegisterType")
            }
        } catch (error) {
          console.log(error);
        }
      }
      useEffect(()=>{
         fetchData();
      },[])

    return (
        <View>
        <Image source={require('../assets/Logo/TiofyLogo.png')} style={{width: width, height:height}} />
        </View>
    )
}

export default LaunchScreen
