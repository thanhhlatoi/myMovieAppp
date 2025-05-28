import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const GenreCard = ({ genreName, active, onPress }) => (
    <TouchableOpacity
        style={[styles.card, active && styles.cardActive]}
        onPress={() => onPress(genreName)}
    >
        <Text style={[styles.text, active && styles.textActive]}>
            {genreName}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardActive: {
        backgroundColor: COLORS.ACTIVE,
        borderColor: COLORS.ACTIVE,
    },
    text: {
        color: COLORS.WHITE,
        fontSize: 14,
        fontFamily: FONTS.REGULAR,
    },
    textActive: {
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
});

export default GenreCard;
