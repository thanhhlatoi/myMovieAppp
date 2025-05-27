import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const MenuOverlay = ({ visible, onClose, onSelect }) => {
  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
      <View style={styles.menuBox}>
        <TouchableOpacity style={styles.menuItem} onPress={() => onSelect('Thông báo')}>
          <MaterialIcons name="notifications" size={20} color="#333" />
          <Text style={styles.itemText}>Thông báo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => onSelect('Cài đặt')}>
          <MaterialIcons name="settings" size={20} color="#333" />
          <Text style={styles.itemText}>Cài đặt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => onSelect('Yêu thích')}>
          <FontAwesome name="heart" size={20} color="#e74c3c" />
          <Text style={styles.itemText}>Yêu thích</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => onSelect('Đăng xuất')}>
          <MaterialIcons name="logout" size={20} color="#333" />
          <Text style={styles.itemText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 10,
    zIndex: 999,
  },
  menuBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  itemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default MenuOverlay;
