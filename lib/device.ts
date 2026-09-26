import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const DEVICE_KEY = "mindmate_device_id";

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `d_\( {Date.now()}_ \){Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function saveDeviceIdToProfile(userId: string) {
  try {
    const deviceId = await getOrCreateDeviceId();
    await supabase
      .from("profiles")
      .update({ device_id: deviceId })
      .eq("id", userId);
  } catch {
    // ignore
  }
}
