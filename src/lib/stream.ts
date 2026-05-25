import Constants from "expo-constants";

/**
 * Returns the base URL for Expo API routes.
 *
 * - In production: set EXPO_PUBLIC_API_URL in your environment.
 * - In development: derives the URL from Expo's dev server host so
 *   both the iOS simulator and physical devices can reach the API.
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    // hostUri looks like "192.168.x.x:8081" or "localhost:8081"
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      return `http://${hostUri}`;
    }
    return "http://localhost:8081";
  }
  throw new Error("EXPO_PUBLIC_API_URL is not set in production");
}
