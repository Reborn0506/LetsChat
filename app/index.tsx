import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, GestureResponderEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig"; // Adjust the import according to your firebase config file path
import { Image } from 'expo-image';
// import logo from '../logo.png';

interface LoginData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<LoginData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: LoginData) => {
    const auth = getAuth(app);
    setLoading(true);

    if (data.email.trim() === "" || data.password.trim() === "") {
      Alert.alert("Error", "Both email and password are required.");
      setLoading(false);
      return;
    }

    try {
      // Use Firebase to authenticate the user with email and password
      await signInWithEmailAndPassword(auth, data.email, data.password);

      // Show success message
      Alert.alert("Success", "Logged in successfully!");

      // Clear the form fields after successful login
      reset();

      // Navigate to /chat page and pass 'username' as a parameter
      router.push({
        pathname: "/chat",
      });
    } catch (error: any) {
      // Firebase error handling
      if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Invalid email format.");
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  function signInWithGoogle(event: GestureResponderEvent): void {
    alert("This function is not available yet. Please try again later.");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
      <Image
        style={styles.letschat}
        source= {require('../logo.png')}
      /> 
      </View>
      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
              message: "Invalid email address",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.errorInput]}
              placeholder="Enter your email"
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters long",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.password && styles.errorInput]}
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)} // Trigger form submission
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => router.push("/signup")}
          disabled={loading}
               >
                <Text style={styles.buttonText}>{loading ? "Signing up..." : "Sign Up"}</Text>
               </TouchableOpacity>

               <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled, { backgroundColor: "#db4a39" }]}
          onPress={signInWithGoogle}
          disabled={loading}   >
          <Text style={styles.buttonText}>{loading ? "Signing in with Google..." : "Sign in with Google(Unavailable)"}</Text>
        </TouchableOpacity> 


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#D0E9C0", // Light background for contrast
  },

  form: {
    marginBottom: 16,
    alignItems: "center", // Center the form contents
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 25,
    backgroundColor: "#F0F8FF",
    padding: 26,
  },
  input: {
    height: 50,
    width: "80%", // Limit width of input to be more centered
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 25, // Make the input round
    paddingLeft: 16,
    marginBottom: 20,
    backgroundColor: "#fff", // White background for input field
    fontSize: 16,
  },
  errorInput: {
    borderColor: "red", // If there's an error, show red border
  },
  button: {
    margin: 10,
    width: "80%", // Same width as the input field
    height: 50,
    borderRadius: 25, // Rounded button
    backgroundColor: "#663399", // Blue background for the button
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#b0c4de", // Lighter color when the button is disabled
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 12,
  },
  signupText: {
    color: 'blue',
    paddingTop: 20,
    textAlign: 'left',
  },
    letschat: {
    color: 'green',
    width: 200, 
    height: 200,
    marginBottom: 50,
    textAlign:"center",
    alignSelf: 'center',
  }
});
