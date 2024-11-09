import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

function ErrorPopup({ visible, message, onClose }) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.popupContainer}>
                    <Text style={styles.errorText}>Error</Text>
                    <Text style={styles.messageText}>{message}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    popupContainer: {
        width: '80%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    errorText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0044FF',
        marginBottom: 15,
    },
    messageText: {
        fontSize: 18,
        textAlign: 'center',
        color: '#0044FF',
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: '#0044FF',
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ErrorPopup;
