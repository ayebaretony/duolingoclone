import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { styled } from "nativewind";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";

const NativeWindImage = styled(Image);

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      <View className="flex-1 px-8">
        <View className="items-center pt-6">
          <View className="flex-row items-center justify-center gap-2">
            <NativeWindImage
              source={images.mascotLogo}
              className="h-[66px] w-[66px]"
              contentFit="contain"
            />
            <Text className="font-poppins-bold text-[40px] leading-[50px] text-text-primary">
              lingua
            </Text>
          </View>
        </View>

        <View className="mt-[52px]">
          <Text className="font-poppins-bold text-[36px] leading-[47px] text-text-primary">
            Your AI language
          </Text>
          <Text className="font-poppins-bold text-[36px] leading-[47px] text-lingua-deep-purple">
            teacher.
          </Text>
          <Text className="mt-3 max-w-[330px] font-poppins text-[18px] leading-[31px] text-text-secondary">
            Real conversations, personalized lessons, anytime, anywhere.
          </Text>
        </View>

        <View className="relative mt-3 flex-1 items-center">
          <View className="absolute left-0 top-5 z-10">
            <SpeechBubble
              label="Hello!"
              className="h-[82px] w-[136px] -rotate-[7deg] bg-[#eef7ff]"
              textClassName="text-[27px] leading-[34px] text-[#05091d]"
              tailClassName="-bottom-[14px] right-4 rotate-[18deg] border-t-[#eef7ff]"
            />
          </View>

          <View className="absolute right-5 top-0 z-10">
            <SpeechBubble
              label="iHola!"
              className="h-[78px] w-[132px] rotate-[11deg] bg-[#f7f5ff]"
              textClassName="text-[27px] leading-[34px] text-lingua-deep-purple"
              tailClassName="-bottom-[13px] left-6 -rotate-[10deg] border-t-[#f7f5ff]"
            />
          </View>

          <View className="absolute right-0 top-[180px] z-10">
            <SpeechBubble
              label="你好!"
              className="h-[69px] w-[110px] rotate-[30deg] bg-[#fff5ef]"
              textClassName="font-poppins-medium text-[28px] leading-[35px] text-[#ff563f]"
              tailClassName="-bottom-[13px] left-[18px] -rotate-[14deg] border-t-[#fff5ef]"
            />
          </View>

          <NativeWindImage
            source={images.mascotWelcome}
            className="mt-[42px] h-[260px] w-[260px]"
            contentFit="contain"
          />
        </View>

        <View className="pb-9">
          <View className="btn-primary h-[84px] w-full flex-row items-center justify-center">
            <Text className="font-poppins-semibold text-[25px] leading-[32px] text-white">
              Get Started
            </Text>
            <View className="absolute right-[42px] h-[22px] w-[22px] rotate-45 border-r-4 border-t-4 border-white" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type SpeechBubbleProps = {
  label: string;
  className: string;
  textClassName: string;
  tailClassName: string;
};

function SpeechBubble({
  label,
  className,
  textClassName,
  tailClassName,
}: SpeechBubbleProps) {
  return (
    <View className={`${className} items-center justify-center rounded-[18px]`}>
      <Text className={`font-poppins-medium ${textClassName}`}>{label}</Text>
      <View
        className={`absolute h-0 w-0 border-l-[18px] border-r-[18px] border-t-[20px] border-l-transparent border-r-transparent ${tailClassName}`}
      />
    </View>
  );
}
