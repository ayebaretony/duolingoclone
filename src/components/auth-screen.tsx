import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { styled } from "nativewind";
import type { MutableRefObject } from "react";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import { images } from "@/constants/images";

WebBrowser.maybeCompleteAuthSession();

const NativeWindImage = styled(Image);

type AuthMode = "sign-up" | "sign-in";

type AuthScreenProps = {
  mode: AuthMode;
};

const screenCopy = {
  "sign-up": {
    title: "Create your account",
    subtitle: "Start your language journey today ✨",
    buttonLabel: "Sign Up",
    footerText: "Already have an account?",
    footerAction: "Log in",
    footerHref: "/sign-in",
  },
  "sign-in": {
    title: "Welcome back",
    subtitle: "Continue your language journey ✨",
    buttonLabel: "Sign In",
    footerText: "New to Lingua?",
    footerAction: "Sign up",
    footerHref: "/sign-up",
  },
} as const;

type SocialProvider = {
  name: "Google" | "Facebook" | "Apple";
  iconName: "google" | "facebook" | "apple";
  iconColor: string;
  strategy: "oauth_google" | "oauth_facebook" | "oauth_apple";
};

const socialProviders: SocialProvider[] = [
  {
    name: "Google",
    iconName: "google",
    iconColor: "#4285f4",
    strategy: "oauth_google",
  },
  {
    name: "Facebook",
    iconName: "facebook",
    iconColor: "#1877f2",
    strategy: "oauth_facebook",
  },
  {
    name: "Apple",
    iconName: "apple",
    iconColor: "#0d132b",
    strategy: "oauth_apple",
  },
];

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const copy = screenCopy[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationVisible, setVerificationVisible] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider["name"] | null>(
    null,
  );
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const isSubmitting =
    signInFetchStatus === "fetching" ||
    signUpFetchStatus === "fetching" ||
    isVerifying ||
    socialLoading !== null;

  const showAuthError = (title: string, error: unknown) => {
    Alert.alert(title, getErrorMessage(error));
  };

  const goHome = () => {
    setVerificationVisible(false);
    router.replace("/");
  };

  const openVerification = () => {
    setCode(["", "", "", "", "", ""]);
    setVerificationVisible(true);

    setTimeout(() => {
      codeInputRefs.current[0]?.focus();
    }, 250);
  };

  const handleAuthPress = async () => {
    if (isSubmitting) {
      return;
    }

    const emailAddress = email.trim();

    if (!emailAddress || (mode === "sign-up" && !password)) {
      Alert.alert("Missing details", "Enter the details above to continue.");
      return;
    }

    if (mode === "sign-up") {
      posthog.capture("sign_up_submitted", { email: emailAddress });

      const { error } = await signUp.password({
        emailAddress,
        password,
      });

      if (error) {
        showAuthError("Couldn't create account", error);
        return;
      }

      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();

      if (verificationError) {
        showAuthError("Couldn't send code", verificationError);
        return;
      }

      openVerification();
      return;
    }

    const { error } = await signIn.emailCode.sendCode({ emailAddress });

    if (error) {
      showAuthError("Couldn't sign in", error);
      return;
    }

    openVerification();
  };

  const handleSocialPress = async (provider: SocialProvider) => {
    if (isSubmitting) {
      return;
    }

    posthog.capture("social_auth_tapped", { provider: provider.name, mode });
    setSocialLoading(provider.name);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: provider.strategy,
        redirectUrl: Linking.createURL("oauth-callback"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        posthog.capture("social_auth_completed", { provider: provider.name, mode });
        goHome();
        return;
      }

      Alert.alert(
        "Sign in not completed",
        `${provider.name} sign in did not return an active session. Check that this social connection is enabled in Clerk.`,
      );
    } catch (error) {
      showAuthError(`Couldn't continue with ${provider.name}`, error);
    } finally {
      setSocialLoading(null);
    }
  };

  const verifyCode = async (verificationCode: string) => {
    if (isVerifying) {
      return;
    }

    setIsVerifying(true);

    try {
      if (mode === "sign-up") {
        const { error } = await signUp.verifications.verifyEmailCode({
          code: verificationCode,
        });

        if (error) {
          showAuthError("Invalid verification code", error);
          return;
        }

        if (signUp.status === "complete") {
          const { error: finalizeError } = await signUp.finalize();

          if (finalizeError) {
            showAuthError("Couldn't finish sign up", finalizeError);
            return;
          }

          const userId = signUp.createdUserId;
          const emailAddress = signUp.emailAddress;
          if (userId) {
            posthog.identify(userId, {
              $set: { email: emailAddress },
              $set_once: { sign_up_date: new Date().toISOString() },
            });
          }
          posthog.capture("sign_up_completed", { email: emailAddress });

          goHome();
          return;
        }

        Alert.alert(
          "More details needed",
          "Clerk needs more information before this account can be completed.",
        );
        return;
      }

      const { error } = await signIn.emailCode.verifyCode({
        code: verificationCode,
      });

      if (error) {
        showAuthError("Invalid verification code", error);
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();

        if (finalizeError) {
          showAuthError("Couldn't finish sign in", finalizeError);
          return;
        }

        const userId = signIn.createdSessionId;
        if (userId) {
          posthog.identify(userId, {
            $set: { email: signIn.identifier },
          });
        }
        posthog.capture("sign_in_completed", { email: signIn.identifier });

        goHome();
        return;
      }

      Alert.alert(
        "More verification needed",
        "Clerk needs another verification step before sign in can be completed.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 1) {
      const nextCode = ["", "", "", "", "", ""];
      digits.split("").forEach((digit, digitIndex) => {
        nextCode[digitIndex] = digit;
      });
      setCode(nextCode);

      if (digits.length === 6) {
        void verifyCode(digits);
      } else {
        codeInputRefs.current[digits.length]?.focus();
      }

      return;
    }

    const nextCode = [...code];
    nextCode[index] = digits;
    setCode(nextCode);

    if (digits && index < nextCode.length - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (nextCode.every(Boolean)) {
      void verifyCode(nextCode.join(""));
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-[30px] pb-8 pt-[22px]">
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <View className="h-[19px] w-[19px] -rotate-45 border-l-[3px] border-t-[3px] border-text-primary" />
          </Pressable>

          <View className="pt-[48px]">
            <Text className="font-poppins-bold text-[31px] leading-[39px] text-text-primary">
              {copy.title}
            </Text>
            <Text className="mt-[18px] font-poppins-medium text-[18px] leading-[26px] text-[#66708d]">
              {copy.subtitle}
            </Text>
          </View>

          <View className="relative h-[204px] items-center">
            <Text className="absolute left-[90px] top-[64px] z-10 font-poppins-bold text-[24px] leading-[30px] text-[#ff9500]">
              ✦
            </Text>
            <Text className="absolute right-[72px] top-[72px] z-10 font-poppins-bold text-[25px] leading-[31px] text-[#5fa4ff]">
              ✦
            </Text>
            <Text className="absolute right-[46px] top-[116px] z-10 font-poppins-bold text-[28px] leading-[34px] text-[#ffd13d]">
              ✦
            </Text>
            <NativeWindImage
              source={images.mascotAuth}
              className="absolute top-[32px] h-[230px] w-[230px]"
              contentFit="contain"
            />
          </View>

          <View className="gap-[18px]">
            <AuthTextField
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              value={email}
            />

            {mode === "sign-up" ? (
              <AuthTextField
                isPassword
                label="Password"
                onChangeText={setPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                secureTextEntry={!showPassword}
                showPassword={showPassword}
                value={password}
              />
            ) : null}

            <Pressable
              disabled={isSubmitting}
              onPress={handleAuthPress}
              style={({ pressed }) => [
                styles.primaryButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text className="font-poppins-semibold text-[22px] leading-[30px] text-white">
                {copy.buttonLabel}
              </Text>
            </Pressable>
          </View>

          <View className="my-[32px] flex-row items-center gap-5">
            <View className="auth__divider-line flex-1" />
            <Text className="font-poppins-medium text-[16px] leading-[22px] text-[#7a829b]">
              or continue with
            </Text>
            <View className="auth__divider-line flex-1" />
          </View>

          <View className="gap-[14px]">
            {socialProviders.map((provider) => (
              <Pressable
                key={provider.name}
                disabled={isSubmitting}
                onPress={() => void handleSocialPress(provider)}
                style={({ pressed }) => [
                  styles.socialButton,
                  isSubmitting && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.socialContent}>
                  <View style={styles.socialIconSlot}>
                    <FontAwesome
                      name={provider.iconName}
                      size={28}
                      color={provider.iconColor}
                      style={styles.socialIcon}
                    />
                  </View>
                  <Text style={styles.socialLabel}>
                    Continue with {provider.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View className="flex-1 justify-end pt-[86px]">
            <View className="flex-row justify-center">
              <Text className="font-poppins text-[16px] leading-[24px] text-[#7a829b]">
                {copy.footerText}{" "}
              </Text>
              <Link href={copy.footerHref} asChild>
                <Pressable
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text className="font-poppins-semibold text-[16px] leading-[24px] text-lingua-deep-purple">
                    {copy.footerAction}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {mode === "sign-up" ? <View nativeID="clerk-captcha" /> : null}
        </View>
      </ScrollView>

      <VerificationModal
        code={code}
        inputRefs={codeInputRefs}
        onChangeDigit={handleCodeChange}
        onClose={() => setVerificationVisible(false)}
        onKeyPress={handleCodeKeyPress}
        visible={verificationVisible}
      />
    </SafeAreaView>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    if ("longMessage" in error && typeof error.longMessage === "string") {
      return error.longMessage;
    }

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }

  return "Please try again.";
}

type AuthTextFieldProps = {
  isPassword?: boolean;
  keyboardType?: "default" | "email-address";
  label: string;
  onChangeText: (value: string) => void;
  onTogglePassword?: () => void;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  value: string;
};

function AuthTextField({
  isPassword = false,
  keyboardType = "default",
  label,
  onChangeText,
  onTogglePassword,
  secureTextEntry,
  showPassword = false,
  value,
}: AuthTextFieldProps) {
  return (
    <View className="auth__field h-[78px] justify-center px-6">
      <Text className="font-poppins-medium text-[15px] leading-[21px] text-[#7a829b]">
        {label}
      </Text>
      <View className="flex-row items-center">
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          style={styles.textInput}
          underlineColorAndroid="transparent"
          value={value}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            hitSlop={10}
            onPress={onTogglePassword}
            style={styles.eyeButton}
          >
            <View className="h-[19px] w-[28px] items-center justify-center rounded-full border-[2px] border-[#7a829b]">
              <View className="h-[7px] w-[7px] rounded-full bg-[#7a829b]" />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type VerificationModalProps = {
  code: string[];
  inputRefs: MutableRefObject<(TextInput | null)[]>;
  onChangeDigit: (value: string, index: number) => void;
  onClose: () => void;
  onKeyPress: (key: string, index: number) => void;
  visible: boolean;
};

function VerificationModal({
  code,
  inputRefs,
  onChangeDigit,
  onClose,
  onKeyPress,
  visible,
}: VerificationModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.modalKeyboardView}
      >
        <View className="flex-1 justify-end bg-black/35 px-5 pb-5">
          <View className="rounded-[28px] bg-white px-5 pb-7 pt-6">
            <View className="mb-5 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="font-poppins-bold text-[23px] leading-[30px] text-text-primary">
                  Check your email
                </Text>
                <Text className="mt-2 font-poppins text-[15px] leading-[23px] text-[#66708d]">
                  You received an email with a verification code. Enter it below
                  to continue.
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Close verification modal"
                hitSlop={10}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text className="font-poppins-semibold text-[20px] leading-[24px] text-[#66708d]">
                  ×
                </Text>
              </Pressable>
            </View>

            <View className="flex-row justify-between gap-2">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(value) => onChangeDigit(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    onKeyPress(nativeEvent.key, index)
                  }
                  ref={(input) => {
                    inputRefs.current[index] = input;
                  }}
                  selectTextOnFocus
                  style={styles.codeInput}
                  textContentType="oneTimeCode"
                  underlineColorAndroid="transparent"
                  value={digit}
                />
              ))}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.58,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#7552ff",
    borderRadius: 16,
    height: 64,
    justifyContent: "center",
    shadowColor: "#5b3bf6",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
  },
  socialButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#eff0f6",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    height: 64,
    justifyContent: "center",
    shadowColor: "#0d132b",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
  },
  socialContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  socialIconSlot: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    width: 34,
  },
  socialIcon: {
    textAlign: "center",
  },
  socialLabel: {
    color: "#0d132b",
    fontFamily: "Poppins-Medium",
    fontSize: 19,
    lineHeight: 26,
  },
  textInput: {
    color: "#0d132b",
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 18,
    lineHeight: 24,
    padding: 0,
  },
  eyeButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 36,
  },
  modalKeyboardView: {
    flex: 1,
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#eff0f6",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  codeInput: {
    backgroundColor: "#f8f9fd",
    borderColor: "#e8eaf2",
    borderRadius: 16,
    borderWidth: 1,
    color: "#0d132b",
    flex: 1,
    fontFamily: "Poppins-SemiBold",
    fontSize: 22,
    height: 58,
    lineHeight: 28,
    maxWidth: 48,
    padding: 0,
    textAlign: "center",
  },
});
