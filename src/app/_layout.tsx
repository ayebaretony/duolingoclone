import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { PostHogProvider } from "posthog-react-native";

import "../../global.css";
import { colors } from "@/theme";
import { posthog } from "@/lib/posthog";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

export default function RootLayout() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false,
        captureTouches: true,
        propsToCapture: ["testID"],
      }}
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: colors.neutral.background,
            },
            headerShown: false,
          }}
        />
      </ClerkProvider>
    </PostHogProvider>
  );
}
