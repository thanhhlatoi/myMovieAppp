import React from 'react';
import { View, StyleSheet } from 'react-native';

const SectionContainer = ({ children, style }) => (
    <View style={[styles.container, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
    },
});

export default SectionContainer;
