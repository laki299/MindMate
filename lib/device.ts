import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const DEVICE_KEY = "mindmate_device_id";

/**
 * লোকাল স্টোরেজ থেকে ডিভাইস আইডি নিয়ে আসে, না থাকলে নতুন তৈরি করে সেভ করে রাখে।
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = "d_" + Date.now() + "_" + Math.random().toString(36).slice(2, 12);
      await AsyncStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch (error) {
    console.error("Device ID retrieval/generation error:", error);
    // ফলব্যাক আইডি যদি AsyncStorage ব্যর্থ হয়
    return "d_fallback_" + Date.now();
  }
}

/**
 * বর্তমান ইউজারের প্রফাইলে ডিভাইস আইডি আপডেট করে।
 */
export async function saveDeviceIdToProfile(userId: string): Promise<void> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const { error } = await supabase
      .from("profiles")
      .update({ device_id: deviceId })
      .eq("id", userId);

    if (error) {
      console.error("Supabase profile device_id update error:", error.message);
    }
  } catch (err) {
    console.error("saveDeviceIdToProfile exception:", err);
  }
}
