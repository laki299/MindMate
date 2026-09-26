import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const VPN_CACHE_KEY = "last_network_check";
const CACHE_MS = 10 * 60 * 1000; // ১০ মিনিট

export async function checkNetworkAndCountry(userId: string): Promise<{
  vpnSuspected: boolean;
  countryCode: string | null;
  countryName: string | null;
}> {
  try {
    const cached = await AsyncStorage.getItem(VPN_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < CACHE_MS) {
        return {
          vpnSuspected: parsed.vpnSuspected,
          countryCode: parsed.countryCode,
          countryName: parsed.countryName,
        };
      }
    }

    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();

    const countryCode = data.country_code || null;
    const countryName = data.country_name || null;

    const org = String(data.org || data.org_name || "");
    const vpnSuspected =
      data.proxy === true ||
      data.hosting === true ||
      /vpn|proxy|hosting|datacenter|cloud/i.test(org);

    const result = {
      vpnSuspected,
      countryCode,
      countryName,
    };

    await AsyncStorage.setItem(
      VPN_CACHE_KEY,
      JSON.stringify({ ...result, ts: Date.now() })
    );

    if (userId && countryCode) {
      await supabase
        .from("profiles")
        .update({
          country_code: countryCode,
          country_name: countryName,
          last_ip: data.ip || null,
        })
        .eq("id", userId);
    }

    return result;
  } catch {
    return { vpnSuspected: false, countryCode: null, countryName: null };
  }
}
