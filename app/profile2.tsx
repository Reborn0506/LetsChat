import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  View, 
  Image, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { Button, TextInput, Portal, Modal } from "react-native-paper";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';
import { get, update, ref as dbRef } from "firebase/database";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

interface UserProfile {
  name: string;
  bio: string;
  birthday: string;
  gender: string;
  photoURL: string;
  joinedDate: string;
}

const GENDER_OPTIONS = [
  { label: 'Select Gender', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'not_specified' }
];

export default function ProfileView() {
  // ... (keep existing state and other functions the same until EditProfileModal)

  const EditProfileModal = () => {
    const [editedProfile, setEditedProfile] = useState(profile);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
      editedProfile.birthday ? new Date(editedProfile.birthday) : new Date()
    );

    const handleDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (selectedDate) {
        setSelectedDate(selectedDate);
        const formattedDate = selectedDate.toISOString().split('T')[0];
        setEditedProfile({ ...editedProfile, birthday: formattedDate });
      }
    };

    const formatDisplayDate = (dateString: string) => {
      if (!dateString) return 'Select Birthday';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <TextInput
              label="Name"
              value={editedProfile.name}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
              style={styles.input}
            />

            <TextInput
              label="Bio"
              value={editedProfile.bio}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerButtonText}>
                {formatDisplayDate(editedProfile.birthday)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={editedProfile.gender}
                onValueChange={(itemValue) => 
                  setEditedProfile({ ...editedProfile, gender: itemValue })}
                style={styles.picker}
              >
                {GENDER_OPTIONS.map((option) => (
                  <Picker.Item 
                    key={option.value} 
                    label={option.label} 
                    value={option.value} 
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => saveProfile(editedProfile)}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  };

  // ... (keep the rest of the component the same)

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
          </View>
        )}
        
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.profileContainer}>
            <Text style={styles.nameText}>{profile.name || "Your Name"}</Text>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{profile.bio || "Add a bio..."}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>
              {profile.birthday ? new Date(profile.birthday).toLocaleDateString() : "Not Set"}
            </Text>
            <Text style={styles.statLabel}>Birthday</Text>
          </View>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>{profile.joinedDate}</Text>
            <Text style={styles.statLabel}>Joined Since</Text>
          </View>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>
              {profile.gender ? 
                profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 
                "Not Set"}
            </Text>
            <Text style={styles.statLabel}>Gender</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <EditProfileModal />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (keep existing styles and add these new ones)
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#0066cc',
  },
  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    maxHeight: '90%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});