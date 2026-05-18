import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-6 px-8">
      <Text className="h3 text-center text-lingua-purple">Lingua</Text>
      <Link href="/onboarding" asChild>
        <Pressable className="btn-primary px-8 py-4">
          <Text className="btn-label">Open Onboarding</Text>
        </Pressable>
      </Link>
    </View>
  );
}
