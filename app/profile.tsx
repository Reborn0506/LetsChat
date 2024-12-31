import React, { useState, useEffect, useRef } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
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
import {Picker} from '@react-native-picker/picker';

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
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    bio: "",
    birthday: "",
    gender: "",
    photoURL: "",
    joinedDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Fetch current user's profile data when component mounts
    const fetchProfileData = async () => {
      const userId = auth?.currentUser?.uid; // Ensure you're using the correct user ID
      if (userId) {
        const userRef = dbRef(db, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setImage(userData.profilePicture || ''); // Set the profile image URL if available
          setProfile(userData.username || ''); // Set the current username
        }
      }
    };

    fetchProfileData();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);
        if (userData.photoURL) {
          setImage(userData.photoURL);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load profile");
      console.error("Load profile error:", error);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "You need to grant gallery permissions to upload photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        await uploadImage(result.assets[0].uri);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to pick image");
      console.error("Pick image error:", error);
    }
  };
  
  const uploadImage = async (uri: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const fileName = `profile_${userId}_${Date.now()}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const fileRef = ref(storage, `profileImages/${userId}/${fileName}`);
      
      await uploadBytes(fileRef, blob);
      const fileURL = await getDownloadURL(fileRef);
      
      setImage(fileURL);
      
      // Update profile photo URL in Firestore
      const db = getFirestore();
      await setDoc(doc(db, "users", userId), {
        ...profile,
        photoURL: fileURL
      }, { merge: true });

    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
      console.error("Upload error:", error);
    }
  };

  const saveProfile = async (updatedProfile: UserProfile) => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const db = getFirestore();
      await setDoc(doc(db, "users", userId), updatedProfile, { merge: true });
      
      setProfile(updatedProfile);
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save profile");
      console.error("Save profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  const EditProfileModal = () => {
    const [editedProfile, setEditedProfile] = useState(profile);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
      editedProfile.birthday ? new Date(editedProfile.birthday) : new Date()
    );
    const [showGenderPicker, setShowGenderPicker] = useState(Platform.OS === 'ios' ? false : true);
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

    
    const handleGenderChange = (itemValue: string) => {
      setEditedProfile({ ...editedProfile, gender: itemValue });
      if (Platform.OS === 'ios') {
        setShowGenderPicker(false);
      }
    };

    const GenderSelector = () => {
      if (Platform.OS === 'ios') {
        return (
          <View>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowGenderPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {editedProfile.gender ? 
                  GENDER_OPTIONS.find(option => option.value === editedProfile.gender)?.label : 
                  'Select Gender'}
              </Text>
            </TouchableOpacity>

            {showGenderPicker && (
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity 
                    onPress={() => setShowGenderPicker(false)}
                    style={styles.iosPickerHeaderButton}
                  >
                    <Text style={styles.iosPickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={editedProfile.gender}
                  onValueChange={handleGenderChange}
                  style={styles.iosPicker}
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
            )}
          </View>
        );
      }

      // Android Picker
      return (
        <View style={styles.androidPickerContainer}>
          <Picker
            selectedValue={editedProfile.gender}
            onValueChange={handleGenderChange}
            style={styles.androidPicker}
            mode="dropdown"
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
      );
    };

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    return (
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
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

              <GenderSelector />


            <View style={styles.modalButtons}>
              <Button onPress={() => setEditModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={() => saveProfile(editedProfile)}>
                Save
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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
            <Text style={styles.statCount}>{profile.birthday || "Not Set"}</Text>
            <Text style={styles.statLabel}>Birthday</Text>
          </View>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>{profile.joinedDate}</Text>
            <Text style={styles.statLabel}>Joined Since</Text>
          </View>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>{profile.gender || "Not Set"}</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    modalContent: {
        padding: 20,
      },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderPhoto: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  bioContainer: {
    padding: 20,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statContainer: {
    alignItems: "center",
    flex: 1,
  },
  statCount: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  button: {
    backgroundColor: "#0066cc",
    borderRadius: 25,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
  },
  input: {
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
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
  pickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  androidPickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  androidPicker: {
    height: 50,
    width: '100%',
  },
  iosPickerContainer: {
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  iosPickerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 15,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iosPickerHeaderButton: {
    paddingHorizontal: 15,
  },
  iosPickerDoneText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    height: 216,
    backgroundColor: 'white',
  },
});