import React from 'react'
import { StatusBar, StyleSheet, Text, View } from 'react-native'

function LiquorDashboard() {
    return (
        <View style={styles.container}>
               <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
            <Text style={{color:'#ffff00'}}>This service is currently unavailable</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#68095f'
    }
})

export default LiquorDashboard
