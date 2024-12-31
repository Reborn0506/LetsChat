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
  Alert
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
    const [date, setDate] = useState(null)
    const [showPicker, setShowPicker] =useState(false)
    const [selectedLanguage, setSelectedLanguage] =useState();
    const [sPicker, setsPicker] =useState(false)

    return (
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
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
             <Button onPress={() => setShowPicker(true)} style={styles.input}>Birthday</Button>
              {
              showPicker &&
              (<DateTimePicker
                mode={'date'}
                value={date || new Date()}/>
              )
              }


              <Button onPress={() => setsPicker(true)} style={styles.input}>Gender</Button>
            {
              sPicker &&
              <Picker
              selectedValue={selectedLanguage}
              onValueChange={(itemValue, itemIndex) =>
                setSelectedLanguage(itemValue)
              }>
                <Picker.Item label="Male" value="male"/>
                <Picker.Item label="Female" value="female"/>
              </Picker>}


            <View style={styles.modalButtons}>
              <Button onPress={() => setEditModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={() => saveProfile(editedProfile)}>
                Save
              </Button>
            </View>
          </ScrollView>
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
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  input: {
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});