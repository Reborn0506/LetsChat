import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { db } from "../firebaseConfig";
import { ref, onValue, push } from "firebase/database";
import React from 'react';
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, TextInput, Text, StyleSheet,TouchableOpacity,Dimensions, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Button, } from "react-native";
import { IconButton } from "react-native-paper";
import { FlashList } from "@shopify/flash-list";
// import { `useRoute` } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import AntDesign from '@expo/vector-icons/AntDesign';


// Define the Chat interface with username and timestamp
interface Chat {
  content: string;
  username: string;
  timestamp: number;
}


export default function HomeScreen(props: any) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Chat>();
  const router = useRouter(); // Used for navigating within expo-router
  // console.log(router);

  // const route = useRoute();  // Used for accessing the route parameters
  const navigation = useNavigation();



  const [chatList, setChatList] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const flashListRef = useRef<FlashList<Chat>>(null);
  const chatsRef = ref(db, "chats");

  const [isListReady, setIsListReady] = useState(false); // Flag to track if the list is mounted
  const currentUser = auth.currentUser;
  const username = currentUser?.email;

  if (!username) {
    console.error("Username not found in route params.");
    // Optionally handle navigation to an error screen or default state
  }

  const onSubmit = async (data: Chat) => {
    setLoading(true);
    try {
      // Push the message along with the username and timestamp
      await push(chatsRef, { ...data, username, timestamp: Date.now() });
      console.log("Message sent:", data.content);
      reset(); // Clear the input after sending
    } catch (error) {
      console.error("Error sending message: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chatData: Chat[] = Object.values(data).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setChatList(chatData || [{}]);
      } else {
        console.log("No data available.");
        setChatList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useLayoutEffect(() => {
    if (isListReady && flashListRef.current) {
      setTimeout(() => {
        if(chatList)
        flashListRef?.current?.scrollToEnd({ animated: true });
      }, 1000);
    }
  }, [chatList, isListReady]);

  // onLayout callback to confirm list is mounted
  const onListLayout = () => {
    if (!isListReady) {
      setIsListReady(true); // Set flag to true after list is mounted and measured
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully.");
      // Optionally navigate to the login screen
      router.push("/"); // Navigate to login screen after logout
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  // Handle the back button press
  const handleBackPress = () => {
    logout(); // Logout before going back
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.header}>
          {/* Back Button with Logout */}
          <IconButton
            icon="arrow-left"
            iconColor="white"
            onPress={handleBackPress} // Trigger the logout on back button press
            style={styles.backButton}
          />
          <Text style={styles.headerText}>LetsChat</Text>
          
          
          <TouchableOpacity
    onPress={() => router.push("/profile")} // Route to the profile page
    disabled={loading}
  >
    <AntDesign name="profile" size={24} color="white" />
  </TouchableOpacity>
        </View>

        <FlashList
          ref={flashListRef}
          data={chatList}
          estimatedItemSize={56}
          renderItem={({ item }) => (
            <View
              style={[
                styles.chatItem,
                item.username === username ? styles.selfChat : styles.otherChat,
              ]}
            >
              {/* Display the username if it's not the current user */}
              {item.username !== username && (
                <Text style={styles.username}>{item.username}</Text>
              )}
              <Text style={styles.chatText}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: "gray", margin: 10 }}>
                There are no messages to show...
              </Text>
            </View>
          }
          onLayout={onListLayout} // Confirm the list is mounted and ready
        />

        <View style={styles.inputContainer}>
          <Controller
            name="content"
            control={control}
            rules={{ required: "Message is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.content && (
            <Text style={styles.error}>{errors.content.message}</Text>
          )}

          <IconButton
            icon="send"
            size={30}
            iconColor="white"
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    height: 60,
    width: Dimensions.get("screen").width,
    backgroundColor: "#008000",
    flexDirection: "row", 
    alignItems: "center",
    paddingHorizontal: 10, 
    position: "relative", 
    fontSize: 36,
    marginBottom: 48,
  },
  inner: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-around',
  },

  headerText: {
    fontSize: 24,
    margin: 10,
    color: "#FFFFFF",
    flex: 1, // Take up remaining space
    textAlign: "left", // Center the text horizontally
  },

  backButton: {
    paddingRight: 20, // Position the button absolutely
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  btnContainer: {
    backgroundColor: 'white',
    marginTop: 12,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#008000",
  },
  chatItem: {
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 15,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  selfChat: {
    backgroundColor: "#d1f7d1",
    alignSelf: "flex-start",
  },
  otherChat: {
    backgroundColor: "#e1ffc7",
    alignSelf: "flex-end",
  },
  username: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    fontSize: 14,
    marginTop: 5,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  chatText: {
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
  },
  textInput: {
    height: 40,
    borderColor: '#000000',
    borderBottomWidth: 1,
    marginBottom: 36,
  },
});
