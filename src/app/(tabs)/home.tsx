import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="h2 text-center">Home</Text>
      <Text className="body-md text-text-secondary mt-3 text-center">
        Placeholder screen for the Home tab.
      </Text>
    </View>
  );
}
