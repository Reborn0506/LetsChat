import React, { useState } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Image, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { Button } from "react-native-paper";
import { getApps, initializeApp } from "firebase/app";
import { app, auth } from '../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


export default function ProfileView() {

  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // Launch image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      uploadImage(result.assets [0].uri);
    }
  };
  
  const uploadImage = async (uri: string) => {
    try {
      const userId = auth?.currentUser?.uid; // Assuming the user is logged in and we have their UID
      const fileName = uri.split('/').pop(); // Get the file name from the URI
  
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const fileRef = ref(storage, 'profileImages/${userId}/${fileName}');
  
      await uploadBytes(fileRef, blob);
      const fileURL = await getDownloadURL(fileRef);
      console.log("fileURL-----------------------------", fileURL)
    } catch (e) {
     console.log("error -------", e)
    }
 };

  const handleEditPress = () => {
    console.log("Edit Profile button pressed");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Button onPress={pickImage}>Pick an image from camera roll</Button>
          {image && <Image source={{ uri: image }} style={styles.profilePhoto} />}
          <View style={styles.profileContainer}>
            <Text style={styles.nameText}>Your Name</Text>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>Hello world</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>2005/06/14</Text>
            <Text style={styles.statLabel}>Birthday</Text>
          </View>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>2024/11/28</Text>
            <Text style={styles.statLabel}>Joined in Since</Text>
          </View>
          <View style={styles.statContainer}>
            <Text style={styles.statCount}>Unknown</Text>
            <Text style={styles.statLabel}>Gender</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.button} onPress={handleEditPress}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
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
  headerContainer: {
    alignItems: "center",
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 20,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  bioContainer: {
    padding: 15,
  },
  bioText: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 20,
  },
  statContainer: {
    alignItems: "center",
    flex: 1,
  },
  statCount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 16,
    color: "#999",
  },
  button: {
    backgroundColor: "#0066cc",
    borderRadius: 5,
    padding: 10,
    marginHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
});


