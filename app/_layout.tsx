import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { PaperProvider } from "react-native-paper";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const auth = getAuth();
  const router = useRouter();
  const [user, setUser] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("#############user", user);
      if (user) {
        setUser(user);
        router.push("/chat");
      } else {
        setUser({});
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{ headerShown: false, title: "Login" }}
          />
          <Stack.Screen
            name="signup"
            options={{ headerShown: false, title: "Signup" }}
          />
          <Stack.Screen
            name="chat"
            options={{ headerShown: false, title: "Chat" }}
          />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
