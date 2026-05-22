import { useAuth } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useEffect } from "react";
import { useLanguageStore } from "@/store/languageStore";

export default function Index() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const { selectedLanguageId, hasHydrated, hydrate } = useLanguageStore();

  useEffect(() => {
    if (!hasHydrated) {
      hydrate();
    }
  }, [hasHydrated, hydrate]);

  useEffect(() => {
    if (isLoaded && isSignedIn && hasHydrated && selectedLanguageId) {
      router.replace("/(tabs)/home");
    }
  }, [isLoaded, isSignedIn, hasHydrated, selectedLanguageId, router]);

  if (!isLoaded || !hasHydrated) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  if (!selectedLanguageId) {
    return <Redirect href="/language-selection" />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View className="flex-1 items-center justify-center gap-6 px-8">
      <Text className="h3 text-center text-lingua-purple">Lingua</Text>
      <Link href="/onboarding" asChild>
        <Pressable className="btn-primary px-8 py-4">
          <Text className="btn-label">Open Onboarding</Text>
        </Pressable>
      </Link>
      <Pressable onPress={handleSignOut} className="mt-4">
        <Text className="text-base font-medium text-lingua-purple">Sign Out</Text>
      </Pressable>
    </View>
  );
}
