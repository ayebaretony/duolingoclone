import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { languages } from "@/data/languages";
import { useLanguageStore } from "@/store/languageStore";
import { images } from "@/constants/images";

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { selectedLanguageId, setSelectedLanguage } = useLanguageStore();
  const [searchText, setSearchText] = useState("");
  const [tempSelected, setTempSelected] = useState(selectedLanguageId);

  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleConfirm = async () => {
    if (tempSelected) {
      await setSelectedLanguage(tempSelected);
      router.replace("/");
    }
  };

  const isLanguageSelected = (languageId: string) => tempSelected === languageId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#0d132b" />
          </Pressable>
          <Text className="h3 text-center flex-1 -ml-7 text-text-primary">
            Choose a language
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View className="mb-6 flex-row items-center gap-3 rounded-full bg-surface px-4 py-3">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              placeholder="Search languages"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 font-poppins text-base text-text-primary"
              placeholderTextColor="#d1d5db"
            />
          </View>

          {/* Popular Section */}
          {filteredLanguages.length > 0 && (
            <>
              <Text className="section-label mb-4">Popular</Text>

              {/* Languages List */}
              <View className="gap-3 mb-8">
                {filteredLanguages.map((language) => (
                  <Pressable
                    key={language.id}
                    onPress={() => setTempSelected(language.id)}
                    className={`flex-row items-center justify-between rounded-2xl px-4 py-4 ${
                      isLanguageSelected(language.id)
                        ? "border-2 border-lingua-purple bg-white"
                        : "bg-white border border-border"
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Text className="text-3xl">{language.flagEmoji}</Text>
                      <View className="flex-1">
                        <Text className="font-poppins-semibold text-base text-text-primary">
                          {language.name}
                        </Text>
                        <Text className="font-poppins text-sm text-text-secondary">
                          {language.learners} learners
                        </Text>
                      </View>
                    </View>
                    {isLanguageSelected(language.id) ? (
                      <View className="bg-lingua-purple rounded-full w-7 h-7 items-center justify-center">
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color="#ffffff"
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#d1d5db"
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {filteredLanguages.length === 0 && (
            <View className="py-8">
              <Text className="text-center text-text-secondary font-poppins">
                No languages found
              </Text>
            </View>
          )}

          {/* Earth Image */}
          <View className="mt-8 mb-8 items-center">
            <Image
              source={images.earth}
              className="w-full h-64"
              resizeMode="contain"
            />
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View className="px-6 pb-6">
          <Pressable
            onPress={handleConfirm}
            disabled={!tempSelected}
            className={`rounded-full py-4 items-center justify-center ${
              tempSelected ? "bg-lingua-purple" : "bg-gray-300"
            }`}
          >
            <Text
              className={`font-poppins-semibold text-base ${
                tempSelected ? "text-white" : "text-gray-600"
              }`}
            >
              Confirm Language
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
