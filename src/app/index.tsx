import { useAuth } from "@clerk/expo";
import { Link, Redirect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const router = useRouter();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
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
      <Pressable
        onPress={() => router.push("/language-selection")}
        className="btn-primary px-8 py-4"
      >
        <Text className="btn-label">Select Language</Text>
      </Pressable>
      <Pressable onPress={handleSignOut} className="mt-4">
        <Text className="text-base font-medium text-lingua-purple">Sign Out</Text>
      </Pressable>
    </View>
  );
}
