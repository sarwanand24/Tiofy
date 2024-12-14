import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

function LiquorDashboard() {
    return (
        <View style={styles.container}>
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
