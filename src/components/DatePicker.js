import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FONTS } from '../constants/Fonts';

const { width } = Dimensions.get('window');

const CustomDatePicker = ({ visible, onClose, onDateSelect, initialDate = new Date() }) => {
    const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
    const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
    const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);

    const handleConfirm = () => {
        const newDate = new Date(selectedYear, selectedMonth, selectedDay);
        onDateSelect(newDate);
        onClose();
    };

    const renderPicker = (items, selectedValue, onValueChange, keyExtractor = (item) => item) => (
        <View style={styles.pickerContainer}>
            <ScrollView 
                style={styles.pickerScrollView}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
            >
                {items.map((item, index) => (
                    <TouchableOpacity
                        key={keyExtractor(item)}
                        style={[
                            styles.pickerItem,
                            selectedValue === item && styles.pickerItemSelected
                        ]}
                        onPress={() => onValueChange(item)}
                    >
                        <Text style={[
                            styles.pickerItemText,
                            selectedValue === item && styles.pickerItemTextSelected
                        ]}>
                            {typeof item === 'string' ? item : item.toString()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Chọn ngày sinh</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Date Pickers */}
                    <View style={styles.pickersContainer}>
                        <View style={styles.pickerColumn}>
                            <Text style={styles.pickerLabel}>Ngày</Text>
                            {renderPicker(days, selectedDay, setSelectedDay)}
                        </View>
                        
                        <View style={styles.pickerColumn}>
                            <Text style={styles.pickerLabel}>Tháng</Text>
                            {renderPicker(months, months[selectedMonth], (month) => {
                                const monthIndex = months.indexOf(month);
                                setSelectedMonth(monthIndex);
                                // Adjust day if it exceeds the new month's days
                                const daysInNewMonth = getDaysInMonth(monthIndex, selectedYear);
                                if (selectedDay > daysInNewMonth) {
                                    setSelectedDay(daysInNewMonth);
                                }
                            })}
                        </View>
                        
                        <View style={styles.pickerColumn}>
                            <Text style={styles.pickerLabel}>Năm</Text>
                            {renderPicker(years, selectedYear, (year) => {
                                setSelectedYear(year);
                                // Adjust day if it's February 29th and new year is not leap year
                                const daysInNewMonth = getDaysInMonth(selectedMonth, year);
                                if (selectedDay > daysInNewMonth) {
                                    setSelectedDay(daysInNewMonth);
                                }
                            })}
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmButtonText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        margin: 20,
        width: width - 40,
        maxWidth: 400,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONTS.BOLD,
    },
    closeButton: {
        padding: 5,
    },
    pickersContainer: {
        flexDirection: 'row',
        paddingVertical: 20,
        paddingHorizontal: 10,
        height: 200,
    },
    pickerColumn: {
        flex: 1,
        marginHorizontal: 5,
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: FONTS.BOLD,
    },
    pickerContainer: {
        height: 160,
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
        overflow: 'hidden',
    },
    pickerScrollView: {
        flex: 1,
    },
    pickerItem: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    pickerItemSelected: {
        backgroundColor: '#E50914',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#ccc',
        fontFamily: FONTS.REGULAR,
    },
    pickerItemTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#333',
        marginRight: 10,
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#E50914',
        marginLeft: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.BOLD,
    },
});

export default CustomDatePicker; 