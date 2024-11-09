import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6'; // Assuming you're using Ionicons
import { useNavigation } from '@react-navigation/native';

const BackButton = ({params}) => {
    const navigation = useNavigation();
    return (
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.container}>
        <Icon name="arrow-left" size={30} color="#000" style={styles.icon} />
        <Text style={styles.text}>{params.text}</Text>
      </TouchableOpacity>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      padding:10
    },
    text: {
      fontSize: 25,
      color: '#000',
      fontWeight: '800'
    },
  });
  
  export default BackButton;
  