import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { supabase } from "./supabase";

let ScreenCapture: {
  preventScreenCaptureAsync?: () => Promise<void>;
  allowScreenCaptureAsync?: () => Promise<void>;
  addScreenshotListener?: (cb: () => void) => { remove: () => void };
  isAvailableAsync?: () => Promise<boolean>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ScreenCapture = require("expo-screen-capture");
} catch {
  ScreenCapture = null;
}

export async function fetchScreenshotBlockEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("screenshot_block_enabled")
      .eq("id", 1)
      .single();
    return data?.screenshot_block_enabled !== false;
  } catch {
    return true;
  }
}

/** স্ক্রিন মাউন্ট থাকাকালীন ব্লক — Admin ON হলে */
export function useSecureScreen(enabled: boolean | null) {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (enabled !== true || !ScreenCapture) return;

    let sub: { remove: () => void } | undefined;
    let mounted = true;

    (async () => {
      try {
        await ScreenCapture?.preventScreenCaptureAsync?.();
      } catch {
        /* Expo Go / web */
      }
    })();

    // iOS: screenshot event (informational)
    try {
      sub = ScreenCapture?.addScreenshotListener?.(() => {
        // optional: analytics
      });
    } catch {
      /* ignore */
    }

    // App background — extra safety on some devices
    const appSub = AppState.addEventListener("change", () => {});

    return () => {
      mounted = false;
      sub?.remove?.();
      appSub.remove();
      ScreenCapture?.allowScreenCaptureAsync?.().catch(() => {});
    };
  }, [enabled]);

  return { isScreenRecording: recording };
}

export async function forceAllowCapture() {
  try {
    await ScreenCapture?.allowScreenCaptureAsync?.();
  } catch {
    /* ignore */
  }
}
