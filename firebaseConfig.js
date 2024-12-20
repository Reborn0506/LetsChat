import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxhcLSBLsOvg_6B-HY0aXoAC-Yu5eAesE",
  authDomain: "nova-demo-13e33.firebaseapp.com",
  databaseURL: "https://nova-demo-13e33-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nova-demo-13e33",
  storageBucket: "nova-demo-13e33.appspot.com",
  messagingSenderId: "773007712209",
  appId: "1:773007712209:web:ca2c68e7b39f2c9d748af0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firebase Database
const db = getDatabase(app);
const storage = getStorage(app);
export { auth, db, app, storage };
