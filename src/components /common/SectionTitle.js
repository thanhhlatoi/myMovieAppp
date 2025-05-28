import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {  FONTS } from '../../constants/Fonts';
import { COLORS } from '../../constants/Colors';

const SectionTitle = ({ title, subtitle, icon, onPress }) => (
    <View style={styles.container}>
        <View style={styles.titleContainer}>
            {icon && <Icon name={icon} size={24} color={COLORS.ACTIVE} style={styles.icon} />}
            <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle && (
            <TouchableOpacity onPress={onPress} style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>{subtitle}</Text>
                <Icon name="chevron-right" size={20} color={COLORS.ACTIVE} />
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.WHITE,
        fontFamily: FONTS.BOLD,
    },
    subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.ACTIVE,
        marginRight: 5,
        fontFamily: FONTS.BOLD,
    },
});

export default SectionTitle;
