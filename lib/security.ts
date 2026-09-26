import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const VPN_CACHE_KEY = "last_network_check";
const CACHE_MS = 10 * 60 * 1000; // ১০ মিনিট — WiFi/Data সুইচে বারবার পপআপ নয়

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

    // ফ্রি IP API — proxy/hosting ফ্ল্যাগ থাকলে VPN সন্দেহ
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();

    const countryCode = data.country_code || null;
    const countryName = data.country_name || null;

    // VPN/Proxy সন্দেহ: hosting / proxy ফ্ল্যাগ (সব VPN ধরে না)
    const vpnSuspected = !!(
      data.version === undefined && false // placeholder
    ) || !!(data.org && /vpn|proxy|hosting|datacenter|cloud/i.test(String(data.org)));

    // কিছু API তে privacy flags থাকে
    const isProxy = data.proxy === true || data.hosting === true;

    const result = {
      vpnSuspected: isProxy || vpnSuspected,
      countryCode,
      countryName,
    };

    await AsyncStorage.setItem(
      VPN_CACHE_KEY,
      JSON.stringify({ ...result, ts: Date.now() })
    );

    // দেশ সেভ (ইউজারকে দেখানো হবে না)
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
    // নেটওয়ার্ক এরর = ব্লক করব না (ডাটা/ওয়াইফাই সুইচ)
    return { vpnSuspected: false, countryCode: null, countryName: null };
  }
      }
