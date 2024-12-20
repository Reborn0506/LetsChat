import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig"; // Adjust the import according to your firebase config file path
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

interface Signup {
  email: string;
  password: string;
}

export default function SignupScreen() {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<Signup>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: Signup) => {
    const auth = getAuth(app);
    setLoading(true);
    

    try {
      // Use Firebase to create a user with email and password
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      Alert.alert("Success", "Account created successfully!");
      reset();
      router.push("/");
    } catch (error: any) {
      // Firebase error handling
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Error", "This email is already in use.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Error", "Invalid email format.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Error", "Password should be at least 6 characters.");
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.whatchatText}>WhatChat</Text>
      </View>
      <View style={styles.form}>
        <Text style={{ color: "#000000", fontSize: 20, marginBottom: 20 }}>Sign Up</Text>

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
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.errorInput]}
              placeholder="Email"
              onBlur={onBlur}
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
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.password && styles.errorInput]}
              placeholder="Password"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Loading..." : "Sign Up"}</Text>
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
    backgroundColor: "#f5f5f5", // Light background for contrast
  },
  form: {
    marginBottom: 16,
    alignItems: "center", // Center the form contents
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 25,
    backgroundColor: "#caabdb",
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
  whatchatText: {
    color: 'blue',
    fontSize: 40,
    textAlign: "center",
    paddingBottom: 90,
  }
});
